# Jury Readiness Report

Assessment date: 17 October 2026. This is a repository-level review; production deployment and live-demo results remain gates.

| Published criterion | Weight | Repository readiness | Evidence / remaining gate |
|---|---:|---:|---|
| Technical merit & GenAI | 40% | 25/40 | Gemini-first paths, grounded prompts, PII controls, deterministic workflow, fallbacks, and 36 reproducible offline control checks exist. Clean build, valid live Gemini/deployed traces, and model-quality evaluation are missing. |
| Problem alignment & impact | 25% | 22/25 | Discovery, personalization, conversational shopping, demand intelligence, customer insight, and merchant operations form one coherent loop. Impact is not measured yet. |
| Innovation & creativity | 25% | 19/25 | The customer-to-merchant closed loop is differentiated. Voice, prediction and agent labels alone are not defensible novelty. |
| UX & solution design | 10% | 7/10 | Navigation, search, role switching, fulfillment and trust surfaces are coherent. Mobile/accessibility, recovery and deployed latency remain unverified. |

Repository evidence ceiling after hardening: **73/100**. This is deliberately conservative and not a predicted competition result. The current submission decision is **NO-GO** until every release blocker passes. See `RUTHLESS_REVIEW.md`.

The application exposes the same evidence boundary at `/evidence`: verified repository checks and unmeasured live/deployed outcomes are presented separately. Its policy simulator is local, non-persistent, and cannot authorize payment or create orders.

## Implemented evidence

- Gemini 3.8 Flash is selected before alternate providers.
- Customer agent requests and merchant review content pass through safety/PII boundaries.
- Pricing, authentication, approval, and order-state transitions do not depend on model output.
- Customer order history and merchant fulfillment use authenticated persistent backend APIs.
- Search covers product, descriptive, category, tag, and merchant fields.
- Artificial route preloader delay and heavyweight template navigation were removed.
- Obsolete mock order APIs, duplicate template loaders, backup pages, external newsletter/support behavior, and misleading architecture slides were removed.
- Default payment is now an explicitly simulated one-time token with no PAN/CVV collection or money movement; COD remains not collected.
- Paid outbound calling, false-success profile behavior, fake saved cards, dead legacy financial APIs, and synthetic real-brand claims were removed.

## Release blockers

1. Rotate all credentials previously shared in chat and place replacements in Secret Manager.
2. Supply a valid Gemini credential; the currently supplied credential returns HTTP 403 from the model-list API.
3. Complete `npm ci`, then pass `npm run lint` and `npm run build` from a clean checkout.
4. Deploy both services to Cloud Run and run the six-step smoke test in the README.
5. Run the demo-token checkout and optional provider adapter tests; do not enable live payment for the hackathon.
6. Add a valid-key Gemini quality set and deployed end-to-end latency measurements; keep them separate from the 36 passing offline control checks.
7. Export the regenerated PPTX to PDF and record a public demo video under three minutes.
