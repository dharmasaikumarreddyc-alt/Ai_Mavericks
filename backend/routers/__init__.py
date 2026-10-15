from .auth import router as auth_router
from .agent import router as agent_router
from .orders import router as orders_router
from .approvals import router as approvals_router
from .wallet import router as wallet_router
from .rules import router as rules_router
from .dashboard import router as dashboard_router
from .cart import router as cart_router
from .products import router as products_router

__all__ = [
    "auth_router",
    "agent_router",
    "orders_router",
    "approvals_router",
    "wallet_router",
    "rules_router",
    "dashboard_router",
    "cart_router",
    "products_router"
]
