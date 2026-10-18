# Loopora — Governed Agentic Commerce Copilot

**AI Builder Cup 2026 · Retail & Commerce**

Loopora is a Gemini-powered commerce copilot that turns customer intent into a grounded, budget-aware shopping plan and then closes the loop into merchant fulfillment and operational insight.

The core idea is simple: **GenAI handles ambiguity and planning; deterministic systems retain commerce truth; humans retain consequential authority.**

---

## The problem

Modern shopping assistants are good at conversation but often stop at recommendation. Real commerce requires much more:

- product discovery grounded in an actual catalog,
- budget and dietary constraints,
- current stock validation,
- safe recovery when a plan becomes invalid,
- explicit customer confirmation,
- persistent order state,
- merchant fulfillment,
- operational recommendations that remain reviewable by humans.

Loopora connects those steps into one governed experience.

## What makes Loopora different

```text
Customer text / optional image
        ↓
Gemini intent + multimodal interpretation
        ↓
Gemini bounded tool planning
        ↓
Application-owned catalog / inventory tools
        ↓
Deterministic price / stock / budget / policy validation
        ↓
Validator feedback → bounded Gemini repair when needed
        ↓
Explicit customer confirmation
        ↓
Persistent order + merchant fulfillment
        ↓
Evidence-backed merchant recommendation
        ↓
Human accept / reject
```

Gemini may interpret, rank, explain and request bounded tools. It does **not** own authoritative product IDs, prices, stock, totals, payment state, order state or merchant operational changes.

## 3-minute judge path

Use one coherent story instead of touring every feature.

1. Open `/cart-pilot#visual-copilot` (or `/copilot-lab`, which redirects there).
2. Run: **“Build a vegan breakfast with coffee under $20. Prefer something healthy.”**
3. Optionally add the synthetic sample image to demonstrate multimodal interpretation.
4. Inspect the decision trace: Gemini planning → application grounding → deterministic validation.
5. Trigger **Stockout rescue** and show the validator rejecting the stale plan, Gemini requesting repair, and the replacement being revalidated.
6. Trigger **Attack test** and show prompt injection blocked before model/tool execution.
7. Return to the valid basket and continue to the customer-confirmed checkout flow.
8. Open the merchant workspace and show the same order moving through fulfillment with evidence-backed, human-reviewed operational guidance.

Detailed demo guidance: [`docs/HACKATHON_DEMO.md`](docs/HACKATHON_DEMO.md)

Fast claim-to-code audit: [`docs/JURY_EVIDENCE.md`](docs/JURY_EVIDENCE.md)

## Core capabilities

- **Gemini 3.8 Flash** as the primary GenAI model.
- Multimodal shopping from text plus optional pantry, shelf, meal or product images.
- Bounded Gemini function/tool planning for catalog discovery and repair flows.
- Catalog-grounded product selection with deterministic price, stock, budget and dietary-tag validation.
- Validator-to-repair workflow for stockout recovery.
- Transparent **live Gemini vs deterministic fallback** labeling.
- Visible decision trace showing ownership by Gemini, application code, deterministic controls and humans.
- Prompt-injection blocking and request-level PII redaction before model access.
- Voice-assisted and conversational shopping flows.
- Authenticated customer checkout with persistent order state.
- Controlled order lifecycle:
  `pending → confirmed → preparing → ready → dispatched → delivered`
- Merchant order processing and directional inventory/demand evidence.
- Human accept/reject boundary for merchant operational recommendations.
- Smart-cart merchant caps and optimization metadata enforced by deterministic code.
- Hard total-budget enforcement across shopping flows.
- Simulated payment-token/COD prototype path without PAN/CVV collection or autonomous money movement.

## Google AI + cloud usage

Loopora uses Google technologies where they materially support the experience rather than adding integrations only for breadth.

- **Gemini API** — intent interpretation, multimodal understanding, bounded tool planning and validator-guided repair.
- **Google Cloud Run** — deployment target for the application/API stack.
- **Google Cloud Secret Manager / runtime environment configuration** — intended production boundary for model credentials and service configuration.

The prototype deliberately keeps commerce invariants in deterministic application code even when Gemini participates in planning.

## Architecture

```text
Next.js application
  ├─ Customer shopping + CartPilot
  ├─ Multimodal Gemini retail copilot
  ├─ Application-owned commerce tools
  ├─ Deterministic validator / fallback
  └─ Merchant experience
             │ authenticated HTTPS
FastAPI backend
  ├─ Authentication
  ├─ Cart and order APIs
  ├─ Fulfillment state machine
  ├─ Merchant intelligence
  └─ PostgreSQL persistence
```

### Agent authority boundary

| Decision | Owner |
|---|---|
| Interpret ambiguous customer need | Gemini |
| Interpret optional retail image | Gemini |
| Request bounded discovery/repair tools | Gemini |
| Product ID / catalog truth | Application |
| Price / stock truth | Application |
| Budget and policy validation | Deterministic control |
| Order / payment / inventory mutation | Application + explicit human action |
| Merchant operational recommendation execution | Human |

## What judges can verify

| Claim | Evidence |
|---|---|
| Real Google Gemini provider is required for live-model evaluation | `scripts/evaluate_gemini.mjs` |
| Deterministic fallback is not counted as Gemini success | `scripts/evaluate_gemini.mjs` |
| Representative cases expect actual tool requests | `evidence/gemini_cases.json` |
| Catalog / stock / budget remain authoritative outside the model | `app/api/agents/retail-copilot/route.ts` |
| Stockout repair is revalidated before display | `app/api/agents/retail-copilot/route.ts` |
| Prompt injection can be blocked pre-model | `app/api/agents/guardrails.ts` + copilot route |
| Human confirmation remains required | runtime governance response + UI flow |
| Deterministic commerce invariants have regressions | `scripts/evaluate_commerce_guards.mjs` |
| Impact evidence is explicitly modeled/synthetic | `backend/evidence/` + `docs/EVALUATION.md` |

See [`docs/JURY_EVIDENCE.md`](docs/JURY_EVIDENCE.md) for the complete audit map.

## Evaluation and verification

Install frontend dependencies and run the normal checks:

```bash
npm ci
npm run lint
npm run build
npm run test:e2e-smoke
npm run eval:commerce-guards
```

Backend verification:

```bash
python -m unittest discover -s backend/tests -v
python backend/evidence/impact_benchmark.py
python backend/evidence/forecast_backtest.py
```

Live Gemini evaluation:

```bash
npm run eval:gemini
```

A valid `GOOGLE_API_KEY` is required for live Gemini evaluation. The evaluator intentionally refuses to treat deterministic fallback as successful Gemini quality.

## Run locally

### Frontend

Requirements: Node.js 20.9+ and npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Add `GOOGLE_API_KEY` to the local environment file. Never commit secrets.

Frontend: `http://localhost:3000`

### Backend

Requirements: Python 3.10+.

```bash
cd backend
python -m venv venv
python -m pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
python main.py
```

Backend API docs: `http://localhost:8000/docs`

## Governance and responsible AI

Loopora is designed so model usefulness does not become model authority.

- Model input is bounded.
- Common request-level PII is redacted before model access.
- Obvious prompt-injection patterns can be blocked before model/tool execution.
- Model-proposed catalog facts are re-resolved against application-owned data.
- Budgets and policy constraints are recomputed deterministically.
- Substitutions are proposals, not silent swaps.
- Chain-of-thought is neither exposed nor required.
- Customer confirmation remains mandatory before consequential checkout actions.
- Merchant recommendations remain review-only.
- Images are bounded and are not persisted by Loopora application storage.

Full governance detail: [`docs/GOVERNANCE.md`](docs/GOVERNANCE.md)

## Evidence boundaries

Catalog data, stock counts, merchant records/history, ratings, offers, demand scenarios and forecasting inputs used in this prototype are **synthetic or directional demo data** unless explicitly stated otherwise.

The repository does **not** present modeled interaction reduction or synthetic forecast backtests as observed production conversion, revenue lift or production forecasting accuracy.

Evaluation methodology: [`docs/EVALUATION.md`](docs/EVALUATION.md)

## Repository guide

- `app/` — Next.js customer, copilot and merchant experiences.
- `app/api/agents/` — Gemini integration, guardrails and governed retail copilot orchestration.
- `backend/` — FastAPI services, persistence and evidence benchmarks.
- `docs/JURY_EVIDENCE.md` — claim → implementation → verification map.
- `docs/GENAI_ARCHITECTURE.md` — GenAI and agent architecture.
- `docs/GOVERNANCE.md` — responsible-AI and authority boundaries.
- `docs/HACKATHON_DEMO.md` — judge demo script.
- `docs/EVALUATION.md` — evidence methodology and limitations.
- `evidence/gemini_cases.json` — representative/adversarial live-model cases.
- `.github/workflows/ci.yml` — automated build, lint, regression and backend verification.

## Submission status

This branch is prepared as the submission snapshot for **AI Builder Cup 2026 — Retail & Commerce**. The current implementation is intended to demonstrate governed agentic commerce, not to claim production readiness or guaranteed competition placement.
