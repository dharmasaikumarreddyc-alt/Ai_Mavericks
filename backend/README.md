# Loopora API

FastAPI service for Loopora's closed-loop retail prototype: customer authentication,
catalog/cart APIs, persistent orders, merchant fulfillment, reviews, governed Gemini
insights, and an explicitly simulated payment-token path.

## Local setup

```bash
cd backend
python -m venv venv
python -m pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python main.py
```

The API is available at `http://localhost:8000`; interactive docs are at `/docs`.

## Configuration

- `DATABASE_URL`: SQLite locally; persistent PostgreSQL for production.
- `SECRET_KEY`: unique random value of at least 32 characters in production.
- `CORS_ORIGINS`: explicit HTTPS frontend origins in production.
- `GOOGLE_API_KEY` and `GOOGLE_MODEL`: Gemini configuration.
- `PAYMENT_MODE=demo`: prototype default; creates a synthetic one-time token, records `simulated`, collects no card data, and moves no money.
- `PAYMENT_MODE=razorpay`: optional hosted-payment adapter requiring provider credentials and separate production/compliance work.

## Supported endpoints

- `POST /auth/signup`, `POST /auth/login/json`, `GET|PUT /auth/me`
- `GET /products`, `GET /products/{id}`
- `GET|POST|PUT|DELETE /cart...`
- `GET /orders`, `GET /orders/{id}`, `GET /orders/stats`
- `GET /payments/config`
- `POST /payments/checkout` for COD or the simulated token
- `POST /payments/intents` and `POST /payments/verify` for the optional hosted-payment adapter
- `POST /payments/reviews`
- `GET /merchant/dashboard`
- `PATCH /merchant/orders/{order_id}/status`
- `POST /merchant/reviews/insights`, `POST /merchant/forecast/today`
- `GET|POST /merchant/actions` for the authenticated recommendation acceptance log
- `GET /governance`
- `GET /health` and `GET /ready`

Legacy autonomous checkout, virtual-card, wallet, approval, and unauthenticated marketplace routes were removed because they were not part of the working product and expanded the attack surface.

## Merchant demo data

Set private `DEMO_MERCHANT_EMAIL` and `DEMO_MERCHANT_PASSWORD` values, then run:

```bash
python -m alembic upgrade head
python seed_merchant_demo.py
```

The seed is idempotent and creates explicitly marked synthetic merchant history. Forecasts and review summaries are decision support, not guarantees.

## Project evidence

See:

- `../docs/GENAI_ARCHITECTURE.md`
- `../docs/GOVERNANCE.md`
- `../docs/EVALUATION.md`

The public repository intentionally keeps internal audit/checklist notes out of the submission branch.
