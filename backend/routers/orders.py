"""Order routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
from services.order_service import OrderService
from routers.auth import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("", response_model=List[dict])
async def get_orders(
    limit: int = 50,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user's orders."""
    orders = await OrderService.get_orders(
        db=db,
        user_id=current_user.id,
        limit=limit
    )
    return orders


@router.get("/stats")
async def get_order_stats(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get order statistics."""
    stats = await OrderService.get_stats(
        db=db,
        user_id=current_user.id
    )
    return stats


@router.get("/{order_id}")
async def get_order(
    order_id: str,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific order."""
    order = await OrderService.get_order(
        db=db,
        user_id=current_user.id,
        order_id=order_id
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    return order
