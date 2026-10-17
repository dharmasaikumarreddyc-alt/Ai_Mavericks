# Loopora Evaluation

This document describes what the repository measures and what it deliberately does not claim.

## Deterministic application checks

The backend evaluation suite covers catalog retrieval, PII redaction, input normalization, order-state transitions, budget enforcement, simulated payment-token boundaries, and signature verification for the optional hosted-payment adapter.

These checks validate application controls only. They do not measure Gemini quality, user conversion, production latency, or production security.

## Live Gemini evaluation

`evidence/gemini_cases.json` contains representative and adversarial shopping missions covering areas such as:

- ambiguous intent
- budget constraints
- dietary constraints
- unsupported products
- conflicting instructions
- PII redaction
- prompt injection
- stockout repair
- model outage
- grounded tool planning
- validator and human-approval behavior

Run:

```bash
npm run eval:gemini
```

A valid Gemini key is required. The runner refuses to treat deterministic fallback as successful live Gemini quality.

## Reproducible supporting evidence

`backend/evidence/impact_benchmark.py` provides a transparent modeled comparison of shopping interaction counts. It is a workflow model, not a human timing or conversion study.

`backend/evidence/forecast_backtest.py` evaluates the prototype's directional forecasting method on held-out synthetic data. It is not production forecast accuracy evidence.

## Full-stack smoke

`npm run test:e2e-smoke` builds/starts the application-level flow and checks key Copilot behaviors such as fallback, budget governance, human confirmation, and prompt-injection blocking. It is an HTTP smoke test, not full browser automation.

## Evidence rules

- Do not present deterministic checks as Gemini-quality scores.
- Do not present modeled interaction reduction as observed user improvement.
- Do not present synthetic forecast metrics as production forecasting accuracy.
- Do not claim successful model behavior until the live Gemini runner records it.
- Keep synthetic/demo data clearly labelled in the UI and submission materials.
