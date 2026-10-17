"""Prototype checkout and persistent order fulfillment."""

from datetime import datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Any, Literal

import httpx

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from agents.base import MERCHANTS
from database import get_db
from database.models import (
    MerchantAccountDB,
    MerchantDB,
    MerchantOrderDB,
    MerchantReviewDB,
    OrderDB,
    PaymentIntentDB,
    generate_id,
)
from routers.auth import get_current_user
from config import settings
from services.payment_security import amount_to_subunits, verify_razorpay_signature

router = APIRouter(prefix="/payments", tags=["Checkout"])


class CheckoutItem(BaseModel):
    productId: str = Field(min_length=1, max_length=100)
    quantity: int = Field(ge=1, le=99)


class CheckoutRequest(BaseModel):
    merchantId: str = Field(min_length=1, max_length=100)
    items: list[CheckoutItem] = Field(min_length=1, max_length=25)
    paymentMethod: Literal["card", "upi", "wallet", "cod"]
    deliveryAddress: str = Field(min_length=1, max_length=1000)
    cookingInstructions: str = Field(default="", max_length=1000)


class MerchantReviewRequest(BaseModel):
    orderId: str = Field(min_length=1, max_length=100)
    rating: int = Field(ge=1, le=5)
    review: str = Field(default="", max_length=2000)


class PaymentVerificationRequest(BaseModel):
    intentId: str = Field(min_length=1, max_length=100)
    razorpayOrderId: str = Field(min_length=1, max_length=100)
    razorpayPaymentId: str = Field(min_length=1, max_length=100)
    razorpaySignature: str = Field(min_length=32, max_length=256)


@router.get("/config")
async def payment_config():
    """Expose only safe checkout capabilities; never provider secrets."""
    return {
        "mode": settings.PAYMENT_MODE,
        "currency": settings.PAYMENT_CURRENCY.upper(),
        "onlineEnabled": settings.PAYMENT_MODE in {"demo", "razorpay"},
        "provider": "razorpay" if settings.PAYMENT_MODE == "razorpay" else "demo_token_vault",
        "moneyMoves": settings.PAYMENT_MODE == "razorpay",
        "cardDataStoredByLoopora": False,
    }


def _require_razorpay() -> tuple[str, str]:
    key_id = (settings.RAZORPAY_KEY_ID or "").strip()
    key_secret = (settings.RAZORPAY_KEY_SECRET or "").strip()
    if not key_id or not key_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Secure online payment is not configured. Choose cash on delivery or contact support.",
        )
    return key_id, key_secret


async def _razorpay_api(
    method: str,
    path: str,
    *,
    json: dict[str, Any] | None = None,
) -> dict[str, Any]:
    key_id, key_secret = _require_razorpay()
    try:
        async with httpx.AsyncClient(
            base_url="https://api.razorpay.com/v1",
            auth=(key_id, key_secret),
            timeout=15,
        ) as client:
            response = await client.request(method, path, json=json)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Payment provider is temporarily unavailable.") from exc
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Payment provider rejected the request.")
    return response.json()


def _money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _build_checkout_items(merchant_id: str, requested_items: list[CheckoutItem]) -> list[dict]:
    merchant_catalog = MERCHANTS.get(merchant_id)
    if merchant_catalog is None:
        raise HTTPException(status_code=404, detail="Merchant not found in the store catalog.")

    catalog = {
        product["id"]: product
        for product in merchant_catalog.get("catalog", [])
        if product.get("available", True)
    }
    checkout_items = []
    for request_item in requested_items:
        product = catalog.get(request_item.productId)
        if product is None:
            raise HTTPException(
                status_code=422,
                detail=f"Product {request_item.productId} is unavailable at this merchant.",
            )
        checkout_items.append(
            {
                "product_id": product["id"],
                "name": product["name"],
                "quantity": request_item.quantity,
                "price": float(product["price"]),
            }
        )
    return checkout_items


def _calculate_pricing(items: list[dict]) -> dict[str, float]:
    subtotal = _money(
        sum(
            Decimal(str(item["price"])) * item["quantity"]
            for item in items
        )
    )
    service_fee = _money(subtotal * Decimal("0.05"))
    delivery_fee = Decimal("2.99")
    tax = _money(subtotal * Decimal("0.0875"))
    total = _money(subtotal + service_fee + delivery_fee + tax)
    return {
        "subtotal": float(subtotal),
        "serviceFee": float(service_fee),
        "deliveryFee": float(delivery_fee),
        "tax": float(tax),
        "loyaltyDiscount": 0.0,
        "total": float(total),
    }


def _payment_result(
    order: OrderDB,
    merchant: MerchantDB,
    pricing: dict[str, float],
    payment_method: str,
    payment_status: str = "not_collected",
    provider_payment_id: str | None = None,
    provider: str | None = None,
    tokenized: bool = False,
    money_moved: bool = False,
    provider_hosted: bool = False,
) -> dict:
    catalog_ids = {
        product["name"]: product["id"]
        for product in MERCHANTS[merchant.id]["catalog"]
    }
    items = [
        {
            "productId": catalog_ids.get(item["name"], item["name"]),
            "name": item["name"],
            "price": item["price"],
            "quantity": item["qty"],
            "total": round(item["price"] * item["qty"], 2),
            "cookingInstructions": item.get("cookingInstructions", ""),
        }
        for item in order.items
    ]
    cooking_instructions = next(
        (item.get("cookingInstructions", "") for item in order.items if item.get("cookingInstructions")),
        "",
    )
    return {
        "success": True,
        "order": {
            "orderId": order.id,
            "merchantId": merchant.id,
            "merchantName": merchant.name,
            "merchantAddress": merchant.address,
            "items": items,
            "cookingInstructions": cooking_instructions,
            "pricing": pricing,
            "status": "confirmed",
            "estimatedReady": "15-25 min",
        },
        "payment": {
            "method": payment_method,
            "status": payment_status,
            "provider": provider,
            "providerPaymentId": provider_payment_id,
            "providerHosted": provider_hosted,
            "tokenizationManagedByProvider": bool(tokenized),
            "tokenized": bool(tokenized),
            "cardDataStoredByLoopora": False,
            "moneyMoved": money_moved,
            "demo": payment_status == "simulated",
        },
        "loyalty": {
            "pointsEarned": 0,
            "message": "Loyalty points are not enabled for this checkout.",
        },
    }


async def _create_persistent_order(
    db: AsyncSession,
    user_id: str,
    merchant: MerchantDB,
    items: list[dict],
    pricing: dict[str, float],
    delivery_address: str,
    payment_method: str,
    order_id: str,
    cooking_instructions: str,
    payment_status: str = "not_collected",
    provider_payment_id: str | None = None,
    provider: str | None = None,
    tokenized: bool = False,
    money_moved: bool = False,
    provider_hosted: bool = False,
) -> dict:
    now = datetime.utcnow()
    serialized_items = [
        {
            **item,
            "image": next(
                (
                    product.get("image", "")
                    for product in MERCHANTS[merchant.id]["catalog"]
                    if product["id"] == item["product_id"]
                ),
                "",
            ),
        }
        for item in items
    ]
    order = OrderDB(
        id=order_id,
        user_id=user_id,
        merchant=merchant.name,
        items=[
            {
                "productId": item["product_id"],
                "name": item["name"],
                "quantity": item["quantity"],
                "qty": item["quantity"],
                "price": item["price"],
                "image": next(
                    (
                        product.get("image", "")
                        for product in MERCHANTS[merchant.id]["catalog"]
                        if product["id"] == item["product_id"]
                    ),
                    "",
                ),
                "cookingInstructions": cooking_instructions,
            }
            for item in items
        ],
        total=pricing["total"],
        savings=0,
        date=now.strftime("%b %d, %Y"),
        status="confirmed",
        agent_task="Customer checkout",
        card=f"{payment_method}:{payment_status}",
        address=delivery_address,
        steps=[
            {
                "time": now.isoformat(),
                "label": "Order placed",
                "detail": (
                    "Provider-confirmed payment captured; order placed successfully."
                    if payment_status == "captured"
                    else "Order placed successfully; payment was not collected."
                ),
                "pricing": pricing,
            },
            *(
                [{
                    "time": now.isoformat(),
                    "label": "Cooking instructions",
                    "detail": cooking_instructions,
                }]
                if cooking_instructions
                else []
            ),
        ],
    )
    if cooking_instructions:
        serialized_items = [
            {**item, "cookingInstructions": cooking_instructions}
            for item in serialized_items
        ]
    merchant_order = MerchantOrderDB(
        id=order_id,
        merchant_id=merchant.id,
        items=serialized_items,
        total=pricing["total"],
        status="confirmed",
        created_at=now,
        is_demo=False,
    )
    db.add_all([order, merchant_order])
    await db.flush()
    return _payment_result(
        order,
        merchant,
        pricing,
        payment_method,
        payment_status,
        provider_payment_id,
        provider,
        tokenized,
        money_moved,
        provider_hosted,
    )


async def _get_checkout_merchant(
    db: AsyncSession,
    merchant_id: str,
) -> MerchantDB:
    merchant = await db.get(MerchantDB, merchant_id)
    if merchant is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This restaurant is not connected to merchant order storage yet.",
        )
    return merchant


async def _reject_merchant_customer(
    db: AsyncSession,
    user_id: str,
) -> None:
    merchant_account_id = await db.scalar(
        select(MerchantAccountDB.id).where(MerchantAccountDB.user_id == user_id)
    )
    if merchant_account_id is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Merchant accounts cannot place customer checkout orders.",
        )


@router.post("/intents", status_code=status.HTTP_201_CREATED)
async def create_payment_intent(
    request: CheckoutRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a server-owned Razorpay order for provider-hosted checkout."""
    if settings.PAYMENT_MODE != "razorpay":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Real online payments are disabled. Use the clearly labelled demo token or cash on delivery.",
        )
    if request.paymentMethod != "card":
        raise HTTPException(status_code=422, detail="This prototype supports one online card path only.")

    await _reject_merchant_customer(db, current_user.id)
    merchant = await _get_checkout_merchant(db, request.merchantId)
    items = _build_checkout_items(request.merchantId, request.items)
    pricing = _calculate_pricing(items)
    intent_id = generate_id("ORD-")
    amount = amount_to_subunits(pricing["total"])
    currency = settings.PAYMENT_CURRENCY.upper()

    provider_order = await _razorpay_api(
        "POST",
        "/orders",
        json={
            "amount": amount,
            "currency": currency,
            "receipt": intent_id,
            "notes": {"aisle_order_id": intent_id, "merchant_id": merchant.id},
        },
    )
    provider_order_id = str(provider_order.get("id", ""))
    if (
        not provider_order_id
        or int(provider_order.get("amount", -1)) != amount
        or str(provider_order.get("currency", "")).upper() != currency
    ):
        raise HTTPException(status_code=502, detail="Payment provider returned an invalid order.")

    stored_items = [
        {**item, "cookingInstructions": request.cookingInstructions.strip()}
        for item in items
    ]
    intent = PaymentIntentDB(
        id=intent_id,
        user_id=current_user.id,
        merchant_id=merchant.id,
        provider_order_id=provider_order_id,
        items=stored_items,
        pricing=pricing,
        delivery_address=request.deliveryAddress,
        requested_method=request.paymentMethod,
        status="created",
        created_at=datetime.utcnow(),
    )
    db.add(intent)
    await db.commit()
    key_id, _ = _require_razorpay()
    return {
        "success": True,
        "mode": "razorpay",
        "intentId": intent.id,
        "keyId": key_id,
        "providerOrderId": provider_order_id,
        "amount": amount,
        "currency": currency,
        "merchantName": merchant.name,
        "description": "Loopora one-time secure checkout",
        "cardDataStoredByLoopora": False,
    }


@router.post("/verify")
async def verify_payment(
    request: PaymentVerificationRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verify provider proof and captured state before creating an order."""
    if settings.PAYMENT_MODE != "razorpay":
        raise HTTPException(status_code=409, detail="Real online payments are disabled.")
    await _reject_merchant_customer(db, current_user.id)
    _, key_secret = _require_razorpay()
    intent = await db.scalar(
        select(PaymentIntentDB)
        .where(
            PaymentIntentDB.id == request.intentId,
            PaymentIntentDB.user_id == current_user.id,
        )
        .with_for_update()
    )
    if intent is None:
        raise HTTPException(status_code=404, detail="Payment intent not found.")
    if request.razorpayOrderId != intent.provider_order_id:
        raise HTTPException(status_code=400, detail="Payment order identifier does not match.")
    if not verify_razorpay_signature(
        intent.provider_order_id,
        request.razorpayPaymentId,
        request.razorpaySignature,
        key_secret,
    ):
        raise HTTPException(status_code=400, detail="Payment signature verification failed.")

    merchant = await _get_checkout_merchant(db, intent.merchant_id)
    existing_order = await db.get(OrderDB, intent.id)
    if intent.status == "captured" and existing_order is not None:
        return _payment_result(
            existing_order,
            merchant,
            intent.pricing,
            intent.requested_method,
            "captured",
            intent.provider_payment_id,
            "razorpay",
            intent.requested_method == "card",
            True,
            True,
        )

    reused_intent_id = await db.scalar(
        select(PaymentIntentDB.id).where(
            PaymentIntentDB.provider_payment_id == request.razorpayPaymentId,
            PaymentIntentDB.id != intent.id,
        )
    )
    if reused_intent_id is not None:
        raise HTTPException(status_code=409, detail="Payment identifier has already been used.")

    payment = await _razorpay_api("GET", f"/payments/{request.razorpayPaymentId}")
    expected_amount = amount_to_subunits(intent.pricing["total"])
    expected_currency = settings.PAYMENT_CURRENCY.upper()
    if (
        str(payment.get("order_id", "")) != intent.provider_order_id
        or int(payment.get("amount", -1)) != expected_amount
        or str(payment.get("currency", "")).upper() != expected_currency
        or payment.get("captured") is not True
        or payment.get("status") != "captured"
    ):
        raise HTTPException(status_code=409, detail="Payment is not captured for the expected amount.")

    actual_method = str(payment.get("method") or intent.requested_method)
    cooking_instructions = next(
        (str(item.get("cookingInstructions", "")) for item in intent.items if item.get("cookingInstructions")),
        "",
    )
    result = await _create_persistent_order(
        db,
        current_user.id,
        merchant,
        intent.items,
        intent.pricing,
        intent.delivery_address,
        actual_method,
        intent.id,
        cooking_instructions,
        "captured",
        request.razorpayPaymentId,
        "razorpay",
        actual_method == "card",
        True,
        True,
    )
    intent.provider_payment_id = request.razorpayPaymentId
    intent.status = "captured"
    await db.commit()
    return result


@router.post("/checkout")
async def create_checkout(
    request: CheckoutRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _reject_merchant_customer(db, current_user.id)
    if request.paymentMethod in {"upi", "wallet"}:
        raise HTTPException(
            status_code=422,
            detail="This focused prototype supports only the demo tokenized card or cash on delivery.",
        )
    if request.paymentMethod == "card" and settings.PAYMENT_MODE == "razorpay":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Use the secure provider-hosted payment flow for card checkout.",
        )
    merchant = await _get_checkout_merchant(db, request.merchantId)
    items = _build_checkout_items(request.merchantId, request.items)
    pricing = _calculate_pricing(items)

    order_id = generate_id("ORD-")
    payment_status = "not_collected"
    provider_payment_id = None
    provider = None
    tokenized = False
    if request.paymentMethod == "card":
        payment_status = "simulated"
        provider = "demo_token_vault"
        provider_payment_id = generate_id("DEMO-TOK-")
        tokenized = True
        db.add(
            PaymentIntentDB(
                id=order_id,
                user_id=current_user.id,
                merchant_id=merchant.id,
                provider_order_id=generate_id("DEMO-ORDER-"),
                provider_payment_id=provider_payment_id,
                items=[
                    {**item, "cookingInstructions": request.cookingInstructions.strip()}
                    for item in items
                ],
                pricing=pricing,
                delivery_address=request.deliveryAddress,
                requested_method="card",
                status="simulated",
                created_at=datetime.utcnow(),
            )
        )
    result = await _create_persistent_order(
        db,
        current_user.id,
        merchant,
        items,
        pricing,
        request.deliveryAddress,
        request.paymentMethod,
        order_id,
        request.cookingInstructions.strip(),
        payment_status,
        provider_payment_id,
        provider,
        tokenized,
        False,
        False,
    )
    await db.commit()
    return result


@router.post("/reviews", status_code=status.HTTP_201_CREATED)
async def submit_merchant_review(
    request: MerchantReviewRequest,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _reject_merchant_customer(db, current_user.id)
    customer_order = await db.scalar(
        select(OrderDB).where(
            OrderDB.id == request.orderId,
            OrderDB.user_id == current_user.id,
        )
    )
    merchant_order = await db.get(MerchantOrderDB, request.orderId)
    if customer_order is None or merchant_order is None:
        raise HTTPException(status_code=404, detail="Order not found for this customer.")

    existing_review = await db.scalar(
        select(MerchantReviewDB.id).where(MerchantReviewDB.order_id == request.orderId)
    )
    if existing_review is not None:
        raise HTTPException(status_code=409, detail="This order has already been reviewed.")

    review = MerchantReviewDB(
        id=generate_id("REV-"),
        merchant_id=merchant_order.merchant_id,
        order_id=merchant_order.id,
        rating=request.rating,
        review=request.review.strip(),
        created_at=datetime.utcnow(),
        is_demo=False,
    )
    db.add(review)
    await db.commit()
    return {"success": True, "reviewId": review.id}
