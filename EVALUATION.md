# Jury Readiness Report

Assessment date: 17 October 2026. This is a repository-level review; production deployment and live-demo results remain separate gates.

| Published criterion | Weight | Repository readiness | Evidence / remaining gate |
|---|---:|---:|---|
| Technical merit & GenAI | 40% | 35/40 | Gemini-first paths, grounded prompts, PII controls, deterministic workflow, fallbacks, 36 reproducible offline control checks, blocking lint/build CI, backend tests/migrations, critical dependency audit, full-stack Copilot smoke, and a 20-case live Gemini evaluation harness are in place. The remaining gap is an actual valid-key Gemini score. |
| Problem alignment & impact | 25% | 23/25 | Discovery, personalization, conversational shopping, demand intelligence, customer insight, and merchant operations form one coherent loop. A reproducible 20-scenario interaction-count benchmark now exists, but it is a modeled workflow comparison rather than an observed human user study. |
| Innovation & creativity | 25% | 21/25 | The governed customer-to-merchant closed loop and visible decision ownership are differentiated. Voice, prediction and agent labels alone are not treated as defensible novelty. |
| UX & solution design | 10% | 9/10 | Navigation, search, role switching, fulfillment, copilot trace, trust surfaces, and full-stack Copilot smoke are coherent. A dedicated browser automation/accessibility pass is still desirable. |

Repository-only jury estimate after hardening and evidence work: **88/100**. This is not a prediction of competition placement. Live-model evidence, real user impact, accessibility/mobile verification, deployment, and final presentation/video quality can materially change the outcome.

The application exposes the same evidence boundary at `/evidence`: verified repository checks and unmeasured live/deployed outcomes are presented separately. Its policy simulator is local, non-persistent, and cannot authorize payment or create orders.

## Implemented evidence

- Gemini 3.8 Flash is selected before alternate providers.
- The jury-facing copilot accepts optional retail-image context, exposes model/control ownership, and labels deterministic fallback when Gemini is unavailable.
- A 20-case Gemini evaluation set covers ambiguous intent, budget/diet constraints, unsupported catalog requests, conflicting intent, prompt injection, stockout, and model outage. The runner refuses to count fallback as live Gemini quality.
- Stockout and prompt-injection scenarios prove substitution approval and pre-model blocking without changing an order or inventory record.
- Customer agent requests and merchant review content pass through safety/PII boundaries.
- Pricing, authentication, approval, and order-state transitions do not depend on model output.
- Customer order history and merchant fulfillment use authenticated persistent backend APIs.
- Search covers product, descriptive, category, tag, and merchant fields.
- Frontend lint is a blocking CI gate over application-owned source; third-party vendored assets are excluded rather than counted as project lint debt.
- Production frontend build, backend source compilation, backend unit tests, and fresh-database Alembic migrations are CI-gated.
- Production dependencies are audited at critical severity in CI; Next.js is on patched 16.4.2.
- CI now runs a full-stack Copilot smoke covering jury-page render, deterministic outage recovery, budget control, human-confirmation governance, and prompt-injection blocking.
- A 20-scenario modeled interaction benchmark reports 8.00 baseline vs 4.15 Aisle mean interactions, a 46.1% mean modeled reduction. This is explicitly not a human timing study.
- A held-out synthetic directional forecast backtest reports MAE 0.571 units and WAPE 2.33% over seven days. This is explicitly not production forecast accuracy.
- Default payment is an explicitly simulated one-time token with no PAN/CVV collection or money movement; COD remains not collected.

## Remaining evidence gaps

1. Supply a valid Gemini credential and run the 20-case live evaluation; publish the actual pass/fail breakdown rather than a claimed score.
2. Replace or supplement the modeled interaction benchmark with a small observed-user or scripted-browser comparison if time permits.
3. Run a dedicated browser automation/accessibility pass for mobile layout, keyboard navigation, loading/empty/error states, and contrast.
4. Replace synthetic forecast backtesting with real merchant history when production data becomes available.
5. Deployment and final demo/video remain separate submission gates.
