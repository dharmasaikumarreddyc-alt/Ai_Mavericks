# Offline Evaluation Results

Run date: 17 October 2026
Runner: `backend/run_evaluation.py` and `backend/tests/test_governance_and_workflow.py`

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

## Local Function Timing

- Median local operation time (p50): 0.30 ms
- 95th percentile local operation time (p95): 0.34 ms
- Scope: in-process catalog search and sanitation only; not browser, network, Gemini, database, or Cloud Run latency.

## Interpretation Boundary

Passing results show that the tested examples currently satisfy their expected deterministic behavior. They are regression evidence, not proof of comprehensive safety. Pricing calculations and order-state authorization remain outside the LLM path.
