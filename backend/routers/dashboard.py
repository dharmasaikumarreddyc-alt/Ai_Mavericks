"""Dashboard routes for aggregated data."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime
from typing import List

from database import get_db
from database.models import OrderDB, ApprovalDB, AgentRunDB, FeedEventDB, SpendingRulesDB
from services.order_service import OrderService
from routers.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get dashboard statistics."""
    # Order stats
    order_stats = await OrderService.get_stats(db, current_user.id)

    # Pending approvals count
    now = datetime.utcnow()
    approvals_result = await db.execute(
        select(ApprovalDB).where(
            ApprovalDB.user_id == current_user.id,
            ApprovalDB.status == "pending"
        )
    )
    approvals = approvals_result.scalars().all()
    pending_approvals = sum(1 for a in approvals if a.expires_at > now)

    # Active watches (agent runs with "watching" status)
    watches_result = await db.execute(
        select(AgentRunDB).where(
            AgentRunDB.user_id == current_user.id,
            AgentRunDB.status == "watching"
        )
    )
    active_watches = len(watches_result.scalars().all())

    # Get spending rules for budget info
    rules_result = await db.execute(
        select(SpendingRulesDB).where(SpendingRulesDB.user_id == current_user.id)
    )
    rules = rules_result.scalar_one_or_none()
    monthly_budget = rules.monthly_budget if rules else 25000.0

    return {
        "spent_this_month": order_stats["month_spent"],
        "total_saved": order_stats["total_savings"],
        "pending_approvals": pending_approvals,
        "active_watches": active_watches,
        "monthly_budget": monthly_budget,
        "budget_used_percent": (order_stats["month_spent"] / monthly_budget * 100) if monthly_budget > 0 else 0
    }


@router.get("/recent-orders")
async def get_recent_orders(
    limit: int = 5,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get recent orders for dashboard preview."""
    orders = await OrderService.get_orders(db, current_user.id, limit=limit)
    return orders


@router.get("/pending-approvals")
async def get_pending_approvals(
    limit: int = 3,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get pending approvals for dashboard preview."""
    now = datetime.utcnow()

    result = await db.execute(
        select(ApprovalDB)
        .where(
            ApprovalDB.user_id == current_user.id,
            ApprovalDB.status == "pending"
        )
        .order_by(desc(ApprovalDB.created_at))
        .limit(limit)
    )
    approvals = result.scalars().all()

    def format_expires(expires_at: datetime) -> str:
        diff = expires_at - now
        if diff.total_seconds() <= 0:
            return "Expired"
        hours = int(diff.total_seconds() // 3600)
        minutes = int((diff.total_seconds() % 3600) // 60)
        return f"Expires in {hours}h {minutes}m"

    return [
        {
            "id": a.id,
            "merchant": a.merchant,
            "item": a.item,
            "qty": a.qty,
            "amount": a.amount,
            "reason": a.reason,
            "expires": format_expires(a.expires_at),
            "comparison": a.comparison
        }
        for a in approvals
        if a.expires_at > now
    ]


@router.get("/feed")
async def get_feed(
    limit: int = 10,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get activity feed for dashboard."""
    result = await db.execute(
        select(FeedEventDB)
        .where(FeedEventDB.user_id == current_user.id)
        .order_by(desc(FeedEventDB.created_at))
        .limit(limit)
    )
    events = result.scalars().all()

    return [
        {
            "id": event.id,
            "type": event.type,
            "title": event.title,
            "detail": event.detail,
            "time": event.time,
            "status": event.status
        }
        for event in events
    ]


@router.get("/overview")
async def get_overview(
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get complete dashboard overview (all data in one call)."""
    # Get all dashboard data
    stats = await get_dashboard_stats(current_user=current_user, db=db)
    recent_orders = await get_recent_orders(limit=5, current_user=current_user, db=db)
    pending_approvals = await get_pending_approvals(limit=3, current_user=current_user, db=db)
    feed = await get_feed(limit=10, current_user=current_user, db=db)

    return {
        "stats": stats,
        "recentOrders": recent_orders,
        "pendingApprovals": pending_approvals,
        "feedEvents": feed,
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "agent_paused": current_user.agent_paused
        }
    }
