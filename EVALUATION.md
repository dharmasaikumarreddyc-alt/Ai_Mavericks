# Jury Readiness Report

Assessment date: 17 October 2026. This is a repository-level review; production deployment and live-demo results remain gates.

| Published criterion | Weight | Repository readiness | Evidence / remaining gate |
|---|---:|---:|---|
| Technical merit & GenAI | 40% | 32/40 | Gemini-first paths, grounded prompts, PII controls, deterministic workflow, fallbacks, 36 reproducible offline control checks, blocking lint/build CI, backend tests/migrations, and a critical production dependency audit gate are in place. Valid live Gemini traces and model-quality evaluation are still missing. |
| Problem alignment & impact | 25% | 23/25 | Discovery, personalization, conversational shopping, demand intelligence, customer insight, and merchant operations form one coherent loop. Customer/business impact is not quantitatively measured yet. |
| Innovation & creativity | 25% | 20/25 | The governed customer-to-merchant closed loop is differentiated. Voice, prediction and agent labels alone are not treated as defensible novelty. |
| UX & solution design | 10% | 8/10 | Navigation, search, role switching, fulfillment, copilot trace, and trust surfaces are coherent. Mobile/accessibility and deployed latency remain unverified. |

Repository-only jury estimate after hardening: **83/100**. This is deliberately not a prediction of competition placement. Deployment, live-model evidence, measured impact, accessibility/mobile verification, and final presentation/video quality can materially change the outcome.

The application exposes the same evidence boundary at `/evidence`: verified repository checks and unmeasured live/deployed outcomes are presented separately. Its policy simulator is local, non-persistent, and cannot authorize payment or create orders.

## Implemented evidence

- Gemini 3.8 Flash is selected before alternate providers.
- The jury-facing copilot accepts an optional locally compressed retail image, exposes the live model/control ownership trace, and labels deterministic fallback when Gemini is unavailable.
- Stockout and prompt-injection scenarios prove substitution approval and pre-model blocking without changing an order or inventory record.
- Customer agent requests and merchant review content pass through safety/PII boundaries.
- Pricing, authentication, approval, and order-state transitions do not depend on model output.
- Customer order history and merchant fulfillment use authenticated persistent backend APIs.
- Search covers product, descriptive, category, tag, and merchant fields.
- Frontend lint is a blocking CI gate over application-owned source; third-party vendored assets are excluded rather than counted as project lint debt.
- Production frontend build, backend source compilation, backend unit tests, and fresh-database Alembic migrations are CI-gated.
- Production dependencies are audited at critical severity in CI. Next.js was upgraded from 16.2.9 to patched 16.4.2 after the audit identified a critical framework advisory.
- Default payment is an explicitly simulated one-time token with no PAN/CVV collection or money movement; COD remains not collected.
- Paid outbound calling, false-success profile behavior, fake saved cards, dead legacy financial APIs, and synthetic real-brand claims were removed.

## Remaining release blockers

1. Rotate all credentials previously shared in chat and place replacements in Secret Manager.
2. Supply a valid Gemini credential and prove the primary Gemini path with a live fixed evaluation set.
3. Add a 20–30 case Gemini quality evaluation covering grounding, constraints, unsupported claims, fallback/abstention, and attack cases.
4. Quantify customer impact with a fixed baseline-vs-Aisle task set; do not invent improvement numbers.
5. Back-test the directional merchant forecast against held-out synthetic history and report sample size/error.
6. Deploy both services to Cloud Run and run the end-to-end smoke path in the README.
7. Confirm mobile layout, keyboard navigation, loading/empty/error states, and readable contrast.
8. Export the regenerated deck to PDF and record the final public demo video.
