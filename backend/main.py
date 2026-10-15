"""Main FastAPI application for Aisle backend."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from database import init_db
from routers import (
    auth_router,
    agent_router,
    orders_router,
    approvals_router,
    wallet_router,
    rules_router,
    dashboard_router,
    cart_router,
    products_router
)
from routers.marketplace import router as marketplace_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    await init_db()
    print("✓ Database initialized")
    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title="Aisle API",
    description="Backend API for Aisle - Agentic AI Checkout",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(agent_router)
app.include_router(orders_router)
app.include_router(approvals_router)
app.include_router(wallet_router)
app.include_router(rules_router)
app.include_router(dashboard_router)
app.include_router(marketplace_router)
app.include_router(cart_router)
app.include_router(products_router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "Aisle API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
