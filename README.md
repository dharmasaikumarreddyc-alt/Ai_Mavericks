# Aisle AI — The Closed-Loop Commerce Copilot

> Turn every customer intent into an order, and every order into a merchant action.

Aisle AI is a Gemini-powered retail experience for the Google AI Builder Cup. Customers can describe what they need, discover grounded products, build budget-aware carts, and confirm an order. Merchants receive the order, process it through a controlled fulfillment workflow, and use Gemini to turn demand and review evidence into decisions.

## Why it stands out

Most commerce assistants end at a recommendation. Aisle AI closes the loop:

```text
Customer intent → Gemini-assisted discovery → deterministic price/policy checks
→ explicit confirmation → persistent order → merchant fulfillment
→ grounded demand/review insight → merchant action
```

The product directly addresses conversational commerce, discovery, personalization, customer insight, demand planning, and operational efficiency without pretending the language model is a payment processor or source of truth.

## Working capabilities

- Gemini 3.8 Flash is the primary model across customer agents and merchant insights, with labelled deterministic fallbacks.
- Conversational/voice discovery, smart cart, budget shop, order prediction, and receipt narration.
- Catalog search across product names, descriptions, categories, tags, and merchants.
- Separate customer and merchant authentication with correct cross-role redirection.
- Persistent customer checkout and merchant-visible orders.
- One honest payment story: free simulated one-time card token or COD; no PAN/CVV collection and no money movement in default mode.
- Guarded order states: `pending → confirmed → preparing → ready → dispatched → delivered`, with validated cancellation paths.
- Merchant dashboard with order processing, operational KPIs, directional demand forecast, grounded review intelligence, and a persisted human-acceptance log for recommendations.
- PII redaction, untrusted-input boundaries, deterministic controls, metadata-only AI telemetry, and a public `/trust` experience.
- Same-origin, payload-size, and burst guards on browser-facing AI routes (prototype protection; production still needs managed edge quotas).
- A public `/evidence` lab with real workflow ownership, architecture, reproducible offline results, unanswered evidence gaps, and a non-persistent policy simulator.
- Grounded `/shop/[id]` product records with price, catalog, availability, and dietary provenance instead of broken template detail links.
- Containerized Next.js and FastAPI services ready for Google Cloud Run.

Card payment is deliberately marked `simulated`; COD is `not_collected`. Catalog, offers, ratings, merchant history, availability and forecasts are synthetic or directional and not guaranteed. See [GOVERNANCE.md](GOVERNANCE.md).

## Architecture

```text
Next.js on Cloud Run
  ├─ Customer + merchant experiences
  ├─ Server-side Gemini agent routes
  └─ Deterministic agent tools and fallbacks
             │ authenticated HTTPS
FastAPI on Cloud Run
  ├─ Auth, cart, order and fulfillment APIs
  ├─ Gemini merchant intelligence
  ├─ Governance and role/ownership controls
  └─ PostgreSQL (Neon for prototype; Cloud SQL-ready boundary)

Secret Manager: Gemini key, database URL, JWT secret
```

## Run locally

Requirements: Node.js 20.9+ (Node 24 recommended), npm, and Python 3.10+.

```powershell
npm ci
Copy-Item .env.example .env.local

cd backend
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.\venv\Scripts\python.exe main.py
```

In another terminal, from the repository root:

```powershell
npm run dev
```

Add `GOOGLE_API_KEY` to both local env files. Never commit secrets. The web app runs on `http://localhost:3000`; API docs are at `http://localhost:8000/docs`.

## Verification

```powershell
npm run lint
npm run build
python -m unittest discover -s backend/tests -v
```

Recommended demo smoke test:

1. Sign in as a customer and search for a product.
2. Ask AI Concierge for a budget-aware order and inspect its grounded choices.
3. Confirm checkout; verify the card path says “simulated token” and “no money moved,” or use COD.
4. Sign in as the linked merchant; open Orders and advance the live order to Ready.
5. Return to the customer account and verify the same status.
6. Show Gemini demand/review insight, its evidence source, and the Trust page.

The latest small offline control/retrieval run is recorded in [EVAL_RESULTS.md](EVAL_RESULTS.md).
It is intentionally not presented as a Gemini or production benchmark.

## Deploy to Google Cloud Run

Create these Secret Manager secrets first: `aisle-database-url`, `aisle-jwt-secret`, and `aisle-gemini-key`. Give the Cloud Run runtime service account Secret Manager access. Use a PostgreSQL async URL (for example `postgresql+asyncpg://...`) and a random JWT secret of at least 32 characters. The deployment keeps `PAYMENT_MODE=demo`, so it needs no paid gateway account.

```powershell
.\deploy-gcp.ps1 -ProjectId YOUR_GCP_PROJECT_ID
```

The script validates that the required secrets exist, deploys the backend with production checks from its first revision, runs `alembic upgrade head` as a one-off Cloud Run Job, deploys the frontend, sets its generated HTTPS URL as the only CORS origin, and prints the readiness URL.

To seed the synthetic merchant dashboard, also create `aisle-demo-merchant-email` and `aisle-demo-merchant-password` with new dedicated demo credentials, then run:

```powershell
.\deploy-gcp.ps1 -ProjectId YOUR_GCP_PROJECT_ID -SeedDemo
```

Never place those credential values in the script, repository, deck, screenshots, or demo video. The seeding job is idempotent and the generated records are explicitly marked as demo data.

## Submission checklist

- Public repository with no secrets and hackathon-period history.
- Working Cloud Run frontend and API URLs.
- PDF deck that accurately labels simulated tokenization, synthetic data, and directional forecasts.
- Public demo video under three minutes: intent → tools → confirmation → merchant order → insight → responsible AI.
- Rotate every credential ever pasted into chat or a screenshot before submission.

No competition result can be guaranteed; this repository is designed to maximize the published technical, alignment, innovation, and UX criteria while keeping claims verifiable.

## Prototype cost boundary

- The default payment demo is entirely local and free; no financial transaction occurs.
- Gemini Developer API offers limited free access for eligible models/regions, with quota limits and data-use terms. The configured key must be valid for the selected model.
- Neon has a free plan suitable for a small demo database, subject to current quotas.
- Cloud Run has a usage-based free tier, but Google Cloud setup can still require a billing account and charges apply beyond free quotas or for related services/egress.
- Razorpay is optional and disabled. Test mode does not move money; live transactions are not free and require merchant onboarding.

Always verify current provider terms immediately before the demo or deployment.
