# Ruthless Product and Jury Review

Assessment date: 17 October 2026. Scope: repository, published AI Builder Cup criteria,
prototype cost boundary, and available local verification. This is not a promise of winning.

## Verdict

**Submission go/no-go: NO-GO today.** The product thesis is strong and the repository is much
cleaner, but a valid Gemini run, clean dependency install/build, Cloud Run deployment, model/deployed
evaluation, PDF export, and sub-three-minute public video are still unverified gates.

Provisional repository evidence ceiling: **73/100**, before deployment/demo penalties.

| Jury factor | Weight | Evidence now | Ruthless assessment |
|---|---:|---:|---|
| Technical merit & GenAI | 40 | 25 | Grounded Gemini paths, PII controls, deterministic commerce, fallbacks, and 36 offline checks exist. No successful live Gemini proof, clean Next build, deployed trace, or model-quality eval yet. |
| Problem alignment & impact | 25 | 22 | Strong match to conversational commerce, discovery, customer insight, demand planning and operations. Impact is asserted, not measured. |
| Innovation & creativity | 25 | 19 | The customer-to-merchant closed loop is differentiated. Voice, prediction and “multi-agent” language alone are not novel. |
| UX & solution design | 10 | 7 | Coherent customer/merchant routes, search, fulfillment and disclosures. CartPilot is oversized, mobile/accessibility coverage is unproven, and error recovery needs deployed testing. |

## What is genuinely good

1. **Closed-loop narrative:** intent becomes a grounded cart, explicit confirmation, persistent
   order, merchant action, and post-order insight. This is stronger than a recommendation-only bot.
2. **Dual-sided demo:** the same order appears for customer and merchant and moves through a
   validated state machine. This is the most persuasive demo moment.
3. **Correct AI boundary:** the model explains/selects; authentication, prices, totals, payment
   status and fulfillment transitions stay deterministic.
4. **Graceful failure:** Gemini outages fall back to bounded evidence instead of inventing facts.
5. **Trust surface:** PII redaction, untrusted-review handling, role ownership, metadata-only AI
   telemetry, synthetic-data labels and public limitations are visible rather than buried.
6. **Focused commerce:** product search, budget composition, order processing, reviews, demand
   outlook and merchant operations all address the published retail theme.

## What was hurting the product and was removed

- Fake saved Visa/UPI records in browser storage.
- Card/UPI/wallet choices that created an order without any payment proof.
- Paid outbound calling, a hard-coded phone number, and disabled TLS verification.
- False-success profile updates and a broken password-reset link.
- Unused autonomous checkout, virtual-card, wallet, approval, rules, duplicate dashboard and
  unauthenticated marketplace APIs.
- Broken product-detail links and decorative cart/favorite controls that did nothing.
- Real-brand names, real-looking addresses, generated review counts and offers attached to
  synthetic data.
- Large backup/template/duplicate route artifacts documented in the Git diff.

## Current payment truth

- Default `PAYMENT_MODE=demo` is free. It creates a synthetic one-time token ID, marks payment
  `simulated`, asks for no PAN/CVV and moves no money.
- COD creates the order with `not_collected`.
- An optional Razorpay hosted-checkout adapter creates the provider order server-side and verifies
  signature, captured state, order ID, amount and currency before creating an order.
- The Razorpay adapter is not production-ready without test credentials, webhook reconciliation,
  provider onboarding, legal/compliance review and operational monitoring. Live transactions cost money.

## Free-resource reality

| Resource | Prototype choice | Cost truth |
|---|---|---|
| Payment | Built-in simulated token + COD | Free; explicitly no transaction |
| Gemini | Gemini Developer API free tier where available | Quota/model/region limited; current supplied key returned 403 |
| PostgreSQL | Neon free plan | Free within current storage/compute quotas |
| Hosting | Cloud Run free tier | Billing setup may be required; related services and excess usage can charge |
| Voice | Browser speech APIs | No vendor bill, but browser/OS support varies |
| Razorpay | Disabled optional adapter | Test mode moves no money; live processing is paid |

Set budget alerts and quotas before any cloud deployment. “Has a free tier” does not mean
“impossible to incur charges.”

## Highest-impact additions, in order

1. **Live model-quality evaluation (must-have):** add fixed valid-key Gemini prompts for grounded selection,
   unsafe disclosure, unsupported claims, fallback rate, and deployed p50/p95 latency. The current 36/36
   result covers deterministic offline controls only.
2. **Outcome/variance follow-up (standout):** the merchant action card now persists acceptance for staff
   review; add a later outcome field so the demo can compare recommendation versus actual demand.
3. **Richer provenance (high value):** the item inspector now exposes model versus fallback, catalog source,
   deterministic pricing, and redaction scope; add matched constraints per item after the live model eval.
4. **Impact proof:** compare normal shopping versus Aisle on the same synthetic tasks—time,
   interactions, budget error and merchant handling time.
5. **CSV catalog upload mock (optional):** show a free local preview and validation report. Do not
   add paid ingestion infrastructure until after the hackathon.

## Do not add before submission

- Fraud detection, loyalty wallets, subscriptions, split settlements or multi-merchant online
  payments: each creates a separate product/compliance story and demo failure surface.
- More agent names or animated “thinking”: judges need evidence and outcomes, not agent theater.
- Real brands, unverified offers, claimed live inventory, fake testimonials or generated KPIs.
- A real payment gateway unless the end-to-end test and webhook path are complete.
- More dashboards. Improve the one decision loop already present.

## Release gates

1. Revoke every secret/password pasted in chat; create fresh values and use Secret Manager.
2. Obtain a valid Gemini key/model combination and capture one successful governed request trace.
3. Run a clean `npm ci`, `npm run lint`, `npm run build`, backend tests and migration rehearsal.
4. Deploy both services to Cloud Run and verify auth role switching, search, cart, demo payment,
   customer order, merchant transition, review and Gemini insight on the deployed URLs.
5. Preserve the passing offline suite and publish a separate valid-key model/deployed evaluation—no invented metrics.
6. Perform mobile, keyboard, screen-reader labels, contrast and slow-network checks.
7. Export the deck to PDF, remove every unsupported claim, and record a public demo under three minutes.
8. Confirm the public repository contains no secrets, personal phone numbers, private data or generated databases.

Only after all eight gates pass should the project be called submission-ready.
