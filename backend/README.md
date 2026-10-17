# Aisle API

FastAPI service for Aisle's supported closed-loop prototype: customer authentication,
catalog/cart APIs, persistent orders, merchant fulfillment, reviews, governed Gemini
insights, and an explicitly simulated payment-token path.

## Local setup

```powershell
cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.\venv\Scripts\python.exe -m alembic upgrade head
.\venv\Scripts\python.exe main.py
```

The API is available at `http://localhost:8000`; interactive docs are at `/docs`.

## Configuration

- `DATABASE_URL`: SQLite locally; persistent PostgreSQL for production.
- `SECRET_KEY`: unique random value of at least 32 characters in production.
- `CORS_ORIGINS`: explicit HTTPS frontend origins in production.
- `GOOGLE_API_KEY` and `GOOGLE_MODEL`: Gemini merchant-insight configuration.
- `PAYMENT_MODE=demo`: free prototype default. Creates a synthetic one-time token,
  records `simulated`, collects no card data, and moves no money.
- `PAYMENT_MODE=razorpay`: optional provider-hosted adapter. Requires both Razorpay
  credentials. Live provider usage may incur charges and needs operational/compliance review.

The default demo needs no paid payment service. Google AI Studio, Neon, and Cloud Run
have limited free tiers/credits but quotas and billing requirements can change; verify them
before deployment. Never commit environment files or paste credentials into docs.

## Supported endpoints

- `POST /auth/signup`, `POST /auth/login/json`, `GET|PUT /auth/me`
- `GET /products`, `GET /products/{id}`
- `GET|POST|PUT|DELETE /cart...`
- `GET /orders`, `GET /orders/{id}`, `GET /orders/stats`
- `GET /payments/config`
- `POST /payments/checkout` for COD or the free simulated token
- `POST /payments/intents` and `POST /payments/verify` for the optional Razorpay adapter
- `POST /payments/reviews`
- `GET /merchant/dashboard`
- `PATCH /merchant/orders/{order_id}/status`
- `POST /merchant/reviews/insights`, `POST /merchant/forecast/today`
- `GET|POST /merchant/actions` for the authenticated recommendation acceptance log
- `GET /governance`
- `GET /health` for liveness and `GET /ready` for database readiness

Legacy autonomous checkout, virtual-card, wallet, approval, and unauthenticated marketplace
routes were removed because they were not part of the working product and expanded the attack
surface.

## Merchant demo data

Set private `DEMO_MERCHANT_EMAIL` and `DEMO_MERCHANT_PASSWORD` values, then run:

```powershell
python -m alembic upgrade head
python seed_merchant_demo.py
```

This creates the fictional Aisle Coffee Lab account plus explicitly marked synthetic history.
The seed is idempotent and refuses to overwrite non-demo data. Forecasts and review summaries
are decision support, not guarantees.

## Production boundary

Run migrations as a controlled release job; production startup intentionally does not mutate
the schema. Before real users, replace browser `localStorage` bearer tokens with secure
HttpOnly/Secure/SameSite sessions, add managed edge rate limiting and monitoring, define data
retention/deletion procedures, configure payment webhooks, and complete provider and legal
review. See the root `GOVERNANCE.md` and `EVALUATION.md`.
