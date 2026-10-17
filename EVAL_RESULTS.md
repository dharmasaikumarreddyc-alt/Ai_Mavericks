# Offline Evaluation Results

Run date: 17 October 2026

## Measured Offline Control Checks

These are in-process checks over a fixed synthetic catalog and deterministic helpers. They do **not** measure Gemini answer quality, production security, network/API latency, or the deployed user journey.

| Offline check | Cases | Passed | Rate |
|---|---:|---:|---:|
| Deterministic catalog retrieval | 21 | 21 | 100% |
| Injection-like text treated as search text | 1 | 1 | 100% |
| PII pattern redaction (email, PAN, phone) | 1 | 1 | 100% |
| Input normalization and length boundary | 1 | 1 | 100% |
| Order state transition rules | 8 | 8 | 100% |
| Synthetic budget ceiling | 1 | 1 | 100% |
| Simulated token format and currency subunits | 2 | 2 | 100% |
| Hosted-provider signature known-answer check | 1 | 1 | 100% |
| **Total offline checks** | **36** | **36** | **100.0%** |

## Modeled Shopping-Workflow Impact

`backend/evidence/impact_benchmark.py` evaluates 20 fixed shopping scenarios using an explicit interaction-count model. This is **not observed human timing** and must not be presented as a user-study result.

- Baseline modeled mean interactions: **8.00**
- Loopora modeled mean interactions: **4.15**
- Total modeled interactions: **160 baseline vs 83 Loopora**
- Mean per-scenario modeled reduction: **46.1%**

The model is intentionally inspectable: baseline counts search/filter, item inspection/addition, cart review and checkout; Loopora counts need description, grounded-basket review, approval and checkout, plus an explicit substitution approval when needed.

## Directional Forecast Backtest

`backend/evidence/forecast_backtest.py` uses four weeks of inspectable synthetic daily demand as training data and one held-out synthetic week. It evaluates the same-weekday averaging concept used by the prototype's directional forecast.

- Held-out days: **7**
- MAE: **0.571 units**
- WAPE: **2.33%**

This is a **synthetic-method backtest**, not evidence of production forecast accuracy. It demonstrates that the forecasting method can be evaluated on held-out data and provides a reproducible benchmark format for real merchant history later.

## Full-Stack Smoke

CI builds the production Next.js application, starts it, renders `/copilot-lab`, runs the explicit model-outage path, verifies budget/human-confirmation governance, and verifies prompt-injection blocking. This is an application-level HTTP end-to-end smoke, not a full browser automation suite.

## Gemini Quality Set

`evidence/gemini_cases.json` defines **20 adversarial and representative cases**, including ambiguous intent, combined budget/diet constraints, unsupported products, conflicting intent, prompt injection, stockout, and model outage. `npm run eval:gemini` runs them against a started application.

A live Gemini score is intentionally **not recorded** until a valid `GOOGLE_API_KEY` is available. The harness refuses to count deterministic fallback as live Gemini quality.

## Local Function Timing

- Median local operation time (p50): 0.37 ms
- 95th percentile local operation time (p95): 0.47 ms
- Scope: in-process catalog search and sanitation only; not browser, network, Gemini, database, or Cloud Run latency.

## Interpretation Boundary

Passing results show that the tested examples currently satisfy their expected deterministic behavior. They are regression evidence, not proof of comprehensive safety. Pricing calculations and order-state authorization remain outside the LLM path.
