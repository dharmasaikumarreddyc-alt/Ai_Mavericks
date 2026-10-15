"""Order service for managing orders and transactions."""

from typing import Dict, List, Any, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from database.models import OrderDB, TransactionDB, VirtualCardDB


class OrderService:
    """Service for order and transaction management."""

    @staticmethod
    async def get_orders(
        db: AsyncSession,
        user_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get user's orders."""
        result = await db.execute(
            select(OrderDB)
            .where(OrderDB.user_id == user_id)
            .order_by(desc(OrderDB.created_at))
            .limit(limit)
        )
        orders = result.scalars().all()

        return [
            {
                "id": order.id,
                "merchant": order.merchant,
                "items": order.items,
                "total": order.total,
                "savings": order.savings,
                "date": order.date,
                "status": order.status,
                "agentTask": order.agent_task,
                "card": order.card,
                "address": order.address,
                "steps": order.steps
            }
            for order in orders
        ]

    @staticmethod
    async def get_order(
        db: AsyncSession,
        user_id: str,
        order_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get a specific order."""
        result = await db.execute(
            select(OrderDB)
            .where(OrderDB.id == order_id, OrderDB.user_id == user_id)
        )
        order = result.scalar_one_or_none()

        if not order:
            return None

        return {
            "id": order.id,
            "merchant": order.merchant,
            "items": order.items,
            "total": order.total,
            "savings": order.savings,
            "date": order.date,
            "status": order.status,
            "agentTask": order.agent_task,
            "card": order.card,
            "address": order.address,
            "steps": order.steps
        }

    @staticmethod
    async def get_stats(
        db: AsyncSession,
        user_id: str
    ) -> Dict[str, Any]:
        """Get order statistics for dashboard."""
        # Get all orders
        result = await db.execute(
            select(OrderDB).where(OrderDB.user_id == user_id)
        )
        orders = result.scalars().all()

        total_spent = sum(order.total for order in orders)
        total_savings = sum(order.savings for order in orders)
        order_count = len(orders)

        # Calculate this month's spending
        now = datetime.utcnow()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        month_orders = [o for o in orders if o.created_at >= start_of_month]
        month_spent = sum(order.total for order in month_orders)

        return {
            "total_spent": total_spent,
            "total_savings": total_savings,
            "order_count": order_count,
            "month_spent": month_spent
        }

    @staticmethod
    async def create_order(
        db: AsyncSession,
        user_id: str,
        order_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create a new order."""
        order = OrderDB(
            user_id=user_id,
            merchant=order_data["merchant"],
            items=order_data["items"],
            total=order_data["total"],
            savings=order_data.get("savings", 0),
            date=order_data.get("date", datetime.now().strftime("%b %d, %Y")),
            status=order_data.get("status", "processing"),
            agent_task=order_data["agent_task"],
            card=order_data["card"],
            address=order_data["address"],
            steps=order_data.get("steps", [])
        )
        db.add(order)
        await db.commit()
        await db.refresh(order)

        return {
            "id": order.id,
            "merchant": order.merchant,
            "items": order.items,
            "total": order.total,
            "savings": order.savings,
            "date": order.date,
            "status": order.status,
            "agentTask": order.agent_task,
            "card": order.card,
            "address": order.address,
            "steps": order.steps
        }
