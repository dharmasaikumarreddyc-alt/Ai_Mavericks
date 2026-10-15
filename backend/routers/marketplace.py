"""Marketplace API - Merchant discovery, ordering, and checkout."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from agents.base import (
    discover_merchants,
    get_merchant_catalog,
    generate_payment_token,
    process_payment,
    create_order,
    get_customer_data,
    MERCHANTS,
)

router = APIRouter(prefix="/marketplace", tags=["marketplace"])


class DiscoverRequest(BaseModel):
    query: str
    max_distance: float = 5.0
    category: Optional[str] = None


class OrderItem(BaseModel):
    id: str
    name: str
    price: float
    qty: int = 1


class OrderRequest(BaseModel):
    merchant_id: str
    items: List[OrderItem]
    customer_id: str
    order_type: str = "pickup"


@router.post("/discover")
async def discover(request: DiscoverRequest):
    """
    AI-powered merchant discovery.

    Example: "Find me a local coffee shop with vegan breakfast and order ahead"
    Returns: List of matching merchants with relevance scoring
    """
    results = discover_merchants(
        query=request.query,
        max_distance=request.max_distance,
        category=request.category,
    )
    return results


@router.get("/merchants")
async def list_merchants(category: Optional[str] = None, limit: int = 20):
    """List all available merchants."""
    merchants = list(MERCHANTS.values())

    if category:
        merchants = [m for m in merchants if m["category"].lower() == category.lower()]

    return merchants[:limit]


@router.get("/merchants/{merchant_id}")
async def get_merchant(merchant_id: str, filter_tags: Optional[str] = None):
    """Get merchant details with catalog."""
    tags = filter_tags.split(",") if filter_tags else None
    merchant = get_merchant_catalog(merchant_id, filter_tags=tags)

    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    return merchant


@router.post("/order")
async def place_order(request: OrderRequest):
    """
    Place an order with tokenized payment.

    Flow:
    1. Generate payment token
    2. Process payment
    3. Create order
    4. Notify merchant
    5. Calculate loyalty points
    6. Return confirmation
    """
    # Validate merchant
    if request.merchant_id not in MERCHANTS:
        raise HTTPException(status_code=404, detail="Merchant not found")

    merchant = MERCHANTS[request.merchant_id]

    # Calculate total
    total = sum(item.price * item.qty for item in request.items)

    # Generate payment token
    token = generate_payment_token(total, request.merchant_id)

    # Process payment
    payment_result = process_payment(token, total, request.merchant_id)

    if not payment_result["success"]:
        raise HTTPException(status_code=400, detail=payment_result.get("error", "Payment failed"))

    # Create order
    items_dict = [{"id": i.id, "name": i.name, "price": i.price, "qty": i.qty} for i in request.items]
    order = create_order(
        merchant_id=request.merchant_id,
        items=items_dict,
        customer_id=request.customer_id,
        payment_result=payment_result,
        order_type=request.order_type,
    )

    # Transform to frontend format
    return {
        "order_id": order["order_id"],
        "merchant_id": request.merchant_id,
        "merchant_name": order["merchant"]["name"],
        "items": order["items"],
        "subtotal": order["subtotal"],
        "total": order["total"],
        "status": order["status"],
        "payment": {
            "card_last4": payment_result.get("card_last4", "0000"),
            "token_status": "destroyed"
        },
        "loyalty": {
            "points_earned": order["loyalty"]["points_earned"],
            "total_points": order["loyalty"]["total_points"]
        },
        "estimated_ready": order["timing"]["estimated_ready"],
        "created_at": order["created_at"]
    }


@router.get("/customer/{customer_id}")
async def get_customer_profile(customer_id: str):
    """Get customer profile with loyalty points and order history."""
    data = get_customer_data(customer_id)
    return data


@router.get("/categories")
async def get_categories():
    """Get available merchant categories."""
    categories = set()
    for merchant in MERCHANTS.values():
        categories.add(merchant["category"])

    return [
        {"id": cat.lower().replace(" ", "-"), "name": cat}
        for cat in sorted(categories)
    ]
