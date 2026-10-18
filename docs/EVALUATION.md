# Loopora Evaluation

This document describes what the repository measures and what it deliberately does not claim.

## Deterministic application checks

The backend evaluation suite covers catalog retrieval, PII redaction, input normalization, order-state transitions, budget enforcement, simulated payment-token boundaries, and signature verification for the optional hosted-payment adapter.

These checks validate application controls only. They do not measure Vertex AI/Gemini quality, user conversion, production latency, or production security.

## Deterministic commerce guard regression

Run the frontend commerce-invariant suite against a running application:

```bash
npm run eval:commerce-guards
```

It checks:

- Smart Cart actually enforces `maxMerchants` instead of only truncating a summary.
- A top-level Smart Cart optimization objective is propagated into the selection contract.
- Smart Cart reports normalized scoring and constraint metadata.
- Budget Shop uses the same USD convention as the synthetic catalog.
- The selected Budget Shop basket cannot exceed the user's total budget, even with flexible item allocations.
- Invalid merchant caps and negative budgets fail closed with HTTP 400 responses.

These are deterministic commerce-safety checks. They are intentionally reported separately from live-model quality.

## Live Vertex AI evaluation

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

The live runner verifies that successful non-fallback cases report the provider as **Google Vertex AI**. In Cloud Run, authentication comes from the attached runtime service identity. For local evaluation, configure `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION=global`, and a short-lived `VERTEX_ACCESS_TOKEN` from `gcloud auth print-access-token`.

The runner refuses to treat deterministic fallback as successful live Vertex AI quality and requires actual function-call evidence for agentic cases.

## Reproducible supporting evidence

`backend/evidence/impact_benchmark.py` provides a transparent modeled comparison of shopping interaction counts. Across its 20 declared synthetic workflow scenarios, the benchmark models 160 baseline interactions versus 83 Loopora interactions: a mean modeled reduction of **46.1%**. This is a workflow-model result, not an observed human timing, conversion, or revenue study.

Reproduce it with:

```bash
python backend/evidence/impact_benchmark.py
```

`backend/evidence/forecast_backtest.py` evaluates the prototype's directional forecasting method on held-out synthetic data. It is not production forecast accuracy evidence.

## Full-stack smoke

`npm run test:e2e-smoke` builds/starts the application-level flow and checks key Copilot behaviors such as fallback, budget governance, human confirmation, and prompt-injection blocking. It is an HTTP smoke test, not full browser automation.

## Evidence rules

- Do not present deterministic checks as Vertex AI/model-quality scores.
- Do not present the modeled 46.1% interaction reduction as observed user improvement.
- Do not present synthetic forecast metrics as production forecasting accuracy.
- Do not claim successful model behavior until the live Vertex AI runner records it.
- Keep synthetic/demo data clearly labelled in the UI and submission materials.
