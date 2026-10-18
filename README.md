# Loopora — The Closed-Loop Commerce Copilot

> Turn every customer intent into an order, and every order into a merchant action.

Loopora is a Gemini-powered retail experience for the Google AI Builder Cup. Customers describe what they need, discover grounded products, build budget-aware carts, and explicitly confirm an order. Merchants receive the same persistent order, process it through a controlled fulfillment workflow, and use Gemini-assisted evidence to support operational decisions.

## Why it stands out

Most commerce assistants stop at recommendation. Loopora closes the loop:

```text
Customer intent / optional image
→ Gemini interpretation and planning
→ application-owned commerce tools
→ deterministic price / stock / budget validation
→ bounded repair when a plan becomes invalid
→ explicit customer confirmation
→ persistent order
→ merchant fulfillment
→ grounded merchant insight
→ human-reviewed merchant action
```

The model helps interpret, plan, rank, explain, and repair proposals. Deterministic services remain authoritative for product IDs, prices, stock, budgets, authentication, payments, order state, and operational changes.

## Judge it in 3 minutes

Open `/copilot-lab` and follow one story instead of touring every dashboard:

1. Run a constrained mission such as **“Build a vegan breakfast with coffee under $20. Prefer something healthy.”** Optionally add the synthetic sample image.
2. Verify that the UI explicitly labels **live Gemini** versus **deterministic fallback**, then inspect bounded tool planning and the decision trace.
3. Trigger **Stockout rescue** to show deterministic validation rejecting a stale plan, Gemini receiving bounded repair feedback, and the repaired basket being revalidated.
4. Trigger **Attack test** to show prompt injection blocked before model/tool execution.
5. Return to the valid basket and show deterministic budget compliance plus explicit human confirmation before checkout or merchant action.

The full timed demo script and claims discipline are in [`docs/HACKATHON_DEMO.md`](docs/HACKATHON_DEMO.md). For a claim-to-code audit trail, see [`docs/JURY_EVIDENCE.md`](docs/JURY_EVIDENCE.md).

## Core capabilities

- Gemini 3.8 Flash as the primary GenAI model.
- Multimodal retail copilot for text plus optional pantry, shelf, meal, or product images.
- Bounded Gemini tool planning over catalog search, inventory checks, constraint validation, and substitution requests.
- Deterministic validation of catalog IDs, price, stock, budget, dietary tags, and approval requirements.
- Validator-to-repair flow for stockout recovery.
- Visible decision trace that shows model, application, deterministic-control, and human ownership without exposing chain-of-thought.
- Conversational and voice-assisted shopping flows.
- Persistent authenticated customer checkout and merchant-visible orders.
- Guarded order lifecycle: `pending → confirmed → preparing → ready → dispatched → delivered` with validated cancellation paths.
- Merchant dashboard with order processing, directional demand evidence, grounded review intelligence, and human acceptance/rejection of recommendations.
- Prompt-injection blocking, PII redaction, bounded model inputs, transparent fallback behavior, and public trust/evidence surfaces.
- Simulated one-time payment token or COD in prototype mode; no PAN/CVV collection and no money movement in the default demo path.
- Smart-cart merchant caps and optimization objectives are deterministic, normalized, and exposed in response metadata.
- Budget shopping has a hard total-budget guard and uses the same USD convention as the synthetic catalog.

Catalog, stock, merchant history, ratings, offers, and forecast data used in the prototype are synthetic or directional and are labelled accordingly.

## Architecture

```text
Next.js
  ├─ Customer + merchant experiences
  ├─ Gemini retail copilot routes
  ├─ Application-owned tools
  └─ Deterministic validation / fallback
             │ authenticated HTTPS
FastAPI
  ├─ Auth, cart, order and fulfillment APIs
  ├─ Merchant intelligence
  ├─ Governance / ownership controls
  └─ PostgreSQL persistence
```

## Run locally

Requirements: Node.js 20.9+, npm, and Python 3.10+.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Backend:

```bash
cd backend
python -m venv venv
python -m pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python main.py
```

Add `GOOGLE_API_KEY` to both local environment files. Never commit secrets.

Frontend: `http://localhost:3000`

Backend API docs: `http://localhost:8000/docs`

## Verification

```bash
npm run lint
npm run build
python -m unittest discover -s backend/tests -v
npm run test:e2e-smoke
npm run eval:commerce-guards
```

Live Gemini evaluation:

```bash
npm run eval:gemini
```

`eval:commerce-guards` verifies deterministic commerce invariants such as merchant-cap enforcement, optimization propagation, USD consistency, hard total-budget enforcement, and fail-closed invalid constraints. `eval:gemini` separately requires a valid Gemini key and refuses to count deterministic fallback as successful live-model quality.

## Judge demo path

1. Open `/copilot-lab`.
2. Enter a constrained shopping mission and optionally add a non-sensitive retail image.
3. Inspect Gemini planning, grounded products, deterministic totals, validator results, and the decision trace.
4. Trigger Stockout rescue to show validator feedback and a bounded repair path.
5. Trigger Attack test to show pre-model prompt-injection blocking.
6. Continue to authenticated customer confirmation and create the order.
7. Open the linked merchant experience and advance the same order through fulfillment.
8. Show evidence-backed merchant insight and explicit human review.
9. Use `/evidence` and `/trust` for architecture, evaluation boundaries, and governance.

## Evidence and governance

- `docs/JURY_EVIDENCE.md` — claim-to-code audit trail and the fastest technical review path.
- `docs/HACKATHON_DEMO.md` — timed 3-minute judge script, scoring focus, and claims discipline.
- `docs/GENAI_ARCHITECTURE.md` — Gemini/tool/validator/human control architecture.
- `docs/EVALUATION.md` — evaluation methodology and known evidence boundaries.
- `docs/GOVERNANCE.md` — data, model, payment, and human-oversight controls.
- `evidence/gemini_cases.json` — adversarial and representative Gemini evaluation cases.
- `scripts/evaluate_commerce_guards.mjs` — reproducible deterministic commerce-invariant checks.
- `backend/evidence/` — reproducible deterministic impact and forecasting benchmarks.

No competition result is guaranteed. The repository is designed to make its claims inspectable and to separate measured evidence from synthetic/demo behavior.
