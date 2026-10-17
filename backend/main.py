"""Main FastAPI application for Aisle backend."""

from collections import defaultdict, deque
from time import monotonic

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import settings
from database import init_db
from routers import (
    auth_router,
    orders_router,
    cart_router,
    products_router
)
from routers.merchant_dashboard import router as merchant_dashboard_router
from routers.payments import router as payments_router
from routers.governance import router as governance_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    if settings.ENVIRONMENT != "production":
        await init_db()
    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title="Aisle API",
    description="Backend API for the Aisle AI closed-loop commerce copilot",
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
app.include_router(orders_router)
app.include_router(merchant_dashboard_router)
app.include_router(payments_router)
app.include_router(cart_router)
app.include_router(products_router)
app.include_router(governance_router)

_request_windows: dict[str, deque[float]] = defaultdict(deque)


@app.middleware("http")
async def security_headers(request, call_next):
    content_length = request.headers.get("content-length")
    try:
        if content_length and int(content_length) > 1_000_000:
            return JSONResponse(status_code=413, content={"detail": "Request body is too large."})
    except ValueError:
        return JSONResponse(status_code=400, content={"detail": "Invalid Content-Length header."})

    if request.method != "GET" and request.url.path.startswith(("/auth", "/merchant", "/payments")):
        client = request.client.host if request.client else "unknown"
        key = f"{client}:{request.url.path}"
        now = monotonic()
        window = _request_windows[key]
        while window and now - window[0] > 60:
            window.popleft()
        if len(window) >= 30:
            return JSONResponse(status_code=429, content={"detail": "Too many requests. Try again shortly."})
        window.append(now)

    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), geolocation=(), payment=()"
    if request.url.path.startswith(("/auth", "/merchant", "/orders", "/cart", "/payments")):
        response.headers["Cache-Control"] = "no-store"
    return response


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
