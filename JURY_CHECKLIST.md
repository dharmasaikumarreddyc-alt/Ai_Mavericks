# Google AI Builder Cup Jury Checklist

Status reflects repository evidence as of 17 October 2026. A checked item means the implementation/evidence exists in the repository; deployment/live-demo-only gates remain unchecked.

## Technical merit and GenAI (40%)

- [ ] Deployed customer flow visibly uses Gemini, not a fallback provider.
- [x] Ambiguous, constrained/budget, stockout, model-outage, and prompt-injection scenarios are implemented for the jury-facing Copilot flow.
- [x] Model ownership is explicit: Gemini interprets/proposes while catalog, pricing, authentication, budget, payment and order transitions remain deterministic.
- [x] Customer orders persist through authenticated backend APIs and the same records are exposed to the linked merchant fulfillment flow.
- [x] CI blocks on frontend lint, critical production dependency audit, production build, full-stack Copilot smoke, backend tests/evidence benchmarks, and fresh Alembic migrations.

## Problem alignment and impact (25%)

- [x] A reproducible 20-scenario modeled interaction benchmark is recorded and explicitly labelled as modeled rather than observed human timing.
- [x] Directional forecast is back-tested on held-out synthetic days with MAE/WAPE and sample scope recorded.
- [x] The documented demo path connects discovery, personalization, explicit confirmation, merchant fulfillment, demand/review insight, and human-reviewed merchant action.

## Innovation and creativity (25%)

- [x] The product leads with the governed customer-to-merchant closed loop rather than generic chatbot positioning.
- [x] Post-order demand/review signals feed merchant recommendations with evidence and persisted human-acceptance logging.
- [x] Customer and merchant experiences are connected through the same persisted order lifecycle.

## UX and solution design (10%)

- [x] Original marketplace visual system, fonts, assets, animations, product cards, header/footer language, and landing experience are restored while current secured flows remain intact.
- [x] Legacy template navigation/social/footer dead ends are removed or repointed to real Aisle AI routes.
- [ ] Complete a dedicated mobile + keyboard + contrast + loading/empty/error accessibility pass in a real browser.
- [ ] Rehearse the final demo path under 2 minutes 30 seconds.

## Evidence and honesty gate

- [x] Default card path is labelled simulated tokenization; no PAN/CVV is collected and no money movement is claimed in demo mode.
- [x] Catalog, availability, merchant history and forecast limitations are identified as synthetic/directional in the product and documentation.
- [x] Offline deterministic/evidence checks are not presented as Gemini-quality evidence.
- [ ] Run the 20-case live Gemini evaluation with a valid credential and publish the actual result breakdown.
- [ ] Verify final screenshots/deployment contain no credentials or personal data and rotate every previously shared key/password before submission.
