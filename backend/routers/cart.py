"""Cart management API."""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from routers.auth import get_current_user
from agents.base import MERCHANTS

router = APIRouter(prefix="/cart", tags=["cart"])

# In-memory cart storage (in production: use Redis or database)
# Structure: {user_id: {items: [...], updated_at: ...}}
CART_STORAGE: Dict[str, Dict] = {}


class CartItem(BaseModel):
    merchant_id: str
    product_id: str
    name: str
    price: float
    quantity: int = 1
    image: Optional[str] = None


class AddToCartRequest(BaseModel):
    merchant_id: str
    product_id: str
    quantity: int = 1


class UpdateCartRequest(BaseModel):
    merchant_id: str
    product_id: str
    quantity: int


@router.get("")
async def get_cart(current_user = Depends(get_current_user)):
    """Get user's cart."""
    user_id = current_user.id
    cart_data = CART_STORAGE.get(user_id, {"items": [], "count": 0, "subtotal": 0})

    # Calculate totals
    items = cart_data.get("items", [])
    subtotal = sum(item["price"] * item["quantity"] for item in items)
    count = sum(item["quantity"] for item in items)

    return {
        "success": True,
        "items": items,
        "count": count,
        "subtotal": subtotal,
        "total": subtotal  # Can add tax/shipping later
    }


@router.post("/add")
async def add_to_cart(
    request: AddToCartRequest,
    current_user = Depends(get_current_user)
):
    """Add item to cart."""
    user_id = current_user.id

    # Validate merchant and product
    merchant = MERCHANTS.get(request.merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    product = None
    for item in merchant.get("catalog", []):
        if item["id"] == request.product_id:
            product = item
            break

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Initialize cart if needed
    if user_id not in CART_STORAGE:
        CART_STORAGE[user_id] = {"items": []}

    cart = CART_STORAGE[user_id]
    items = cart["items"]

    # Check if item already in cart
    existing_item = None
    for item in items:
        if item["merchant_id"] == request.merchant_id and item["product_id"] == request.product_id:
            existing_item = item
            break

    if existing_item:
        # Update quantity
        existing_item["quantity"] += request.quantity
    else:
        # Add new item
        items.append({
            "merchant_id": request.merchant_id,
            "merchant_name": merchant["name"],
            "product_id": request.product_id,
            "name": product["name"],
            "price": product["price"],
            "quantity": request.quantity,
            "image": product.get("image")
        })

    # Calculate totals
    subtotal = sum(item["price"] * item["quantity"] for item in items)
    count = sum(item["quantity"] for item in items)

    return {
        "success": True,
        "message": "Item added to cart",
        "cart": {
            "items": items,
            "count": count,
            "subtotal": subtotal,
            "total": subtotal
        }
    }


@router.put("/update")
async def update_cart_item(
    request: UpdateCartRequest,
    current_user = Depends(get_current_user)
):
    """Update cart item quantity."""
    user_id = current_user.id

    if user_id not in CART_STORAGE:
        raise HTTPException(status_code=404, detail="Cart not found")

    cart = CART_STORAGE[user_id]
    items = cart["items"]

    # Find and update item
    item_found = False
    for item in items:
        if item["merchant_id"] == request.merchant_id and item["product_id"] == request.product_id:
            if request.quantity <= 0:
                items.remove(item)
            else:
                item["quantity"] = request.quantity
            item_found = True
            break

    if not item_found:
        raise HTTPException(status_code=404, detail="Item not found in cart")

    # Calculate totals
    subtotal = sum(item["price"] * item["quantity"] for item in items)
    count = sum(item["quantity"] for item in items)

    return {
        "success": True,
        "message": "Cart updated",
        "cart": {
            "items": items,
            "count": count,
            "subtotal": subtotal,
            "total": subtotal
        }
    }


@router.delete("/remove")
async def remove_from_cart(
    merchant_id: str,
    product_id: str,
    current_user = Depends(get_current_user)
):
    """Remove item from cart."""
    user_id = current_user.id

    if user_id not in CART_STORAGE:
        raise HTTPException(status_code=404, detail="Cart not found")

    cart = CART_STORAGE[user_id]
    items = cart["items"]

    # Find and remove item
    item_found = False
    for item in items:
        if item["merchant_id"] == merchant_id and item["product_id"] == product_id:
            items.remove(item)
            item_found = True
            break

    if not item_found:
        raise HTTPException(status_code=404, detail="Item not found in cart")

    # Calculate totals
    subtotal = sum(item["price"] * item["quantity"] for item in items)
    count = sum(item["quantity"] for item in items)

    return {
        "success": True,
        "message": "Item removed from cart",
        "cart": {
            "items": items,
            "count": count,
            "subtotal": subtotal,
            "total": subtotal
        }
    }


@router.delete("/clear")
async def clear_cart(current_user = Depends(get_current_user)):
    """Clear entire cart."""
    user_id = current_user.id

    if user_id in CART_STORAGE:
        CART_STORAGE[user_id] = {"items": []}

    return {
        "success": True,
        "message": "Cart cleared",
        "cart": {
            "items": [],
            "count": 0,
            "subtotal": 0,
            "total": 0
        }
    }
