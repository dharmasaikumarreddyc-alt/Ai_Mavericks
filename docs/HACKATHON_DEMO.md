# AI Builder Cup — 3-Minute Judge Demo

This is the submission/demo path for Loopora. Do not try to show every feature. The product story is **closed-loop, trusted agentic commerce**: Vertex AI serves Gemini 3.8 Flash for interpretation and planning; application tools retrieve commerce facts; deterministic controls validate them; humans retain authority over consequential actions.

Official AI Builder Cup judging weights (2026): Technical Merit & GenAI Implementation 40%, Problem Alignment & Impact 25%, Innovation & Creativity 25%, User Experience & Solution Design 10%. Source: https://aibuildercup.com/themes.html

## One-sentence pitch

**Loopora uses Gemini 3.8 Flash on Vertex AI to turn multimodal customer intent into a grounded, constraint-checked retail basket, automatically repair invalid plans such as stockouts, and carry the same confirmed intent into merchant operations without giving the model authority over price, inventory, payment, or order state.**

## The 3-minute flow

### 0:00–0:25 — Problem and differentiation

Open `/copilot-lab`.

Say:

> Retail assistants usually stop at recommendations. Loopora closes the loop from customer intent to a validated basket, human-confirmed order, merchant fulfillment, and evidence-backed merchant action.

Point to the boundary labels: Vertex AI / multimodal Gemini, catalog grounded, human confirmed, synthetic catalog.

### 0:25–1:15 — Prove meaningful Vertex AI use

Use a constrained request such as:

> Build a vegan breakfast with coffee under $20. Prefer something healthy.

Optionally load the synthetic sample image. Run **Live path**.

Show only these proof points:

1. The runtime provider reports **Google Vertex AI** rather than deterministic fallback.
2. Gemini 3.8 Flash on Vertex AI interprets intent and performs bounded function/tool planning.
3. Products come from the application-owned catalog rather than model-generated commerce facts.
4. Price, stock, dietary constraints, and total budget are deterministically revalidated.
5. The decision trace names the owner of each decision without exposing chain-of-thought.
6. Production model access is Cloud IAM/service-identity based; there is no stored Gemini API key in the Cloud Run path.

Do not claim image understanding if the result says deterministic fallback.

### 1:15–1:55 — Prove the agent can recover

Switch to **Stockout rescue** and run the same mission.

Show:

- the first proposal becomes invalid because inventory changed;
- the deterministic validator rejects it;
- the agent receives bounded repair feedback;
- Vertex AI requests a bounded repair;
- the repaired plan is revalidated;
- any substitution requiring customer approval remains pending rather than silently entering checkout.

This is the strongest technical moment in the demo. Spend time here.

### 1:55–2:20 — Prove safety and reliability

Switch to **Attack test**.

Show that the prompt injection is blocked before model/tool execution and that no cart, order, inventory, or payment state changes.

Then mention that **Model outage** is a separately labelled deterministic fallback—not disguised as Vertex AI output.

### 2:20–2:45 — Close the commerce loop

Return to a successful result and show:

- deterministic subtotal and budget compliance;
- explicit customer confirmation before checkout;
- the linked merchant decision;
- merchant recommendations require human accept/reject review.

If time permits, follow the same order into the merchant workspace. Do not open unrelated dashboards.

### 2:45–3:00 — End with inspectable evidence

Close with:

> The innovation is not another shopping chatbot. It is a governed agentic commerce loop on Google Cloud: Vertex AI handles ambiguity and planning, deterministic systems remain authoritative for commerce facts, and humans remain authoritative for consequential actions.

Mention the reproducible evaluation commands:

```bash
npm run eval:gemini
npm run eval:commerce-guards
```

## What judges should remember

- **Meaningful Google Cloud GenAI:** Vertex AI serves Gemini 3.8 Flash for multimodal interpretation, bounded planning, ranking/explanation, and validator-guided repair—not for pretending to be the database.
- **Cloud-native identity:** Cloud Run uses a dedicated service account with `roles/aiplatform.user`; production model access does not depend on a Gemini API key.
- **Technical merit:** tool use, deterministic validation, repair loops, explicit fallback, guardrails, persistent order flow, and reproducible evaluation.
- **Problem impact:** one flow improves both sides of commerce: less customer search/friction and more actionable merchant context.
- **Innovation:** model reasoning and application authority are deliberately separated; invalid plans are repaired instead of blindly executed.
- **UX:** the UI exposes live/fallback mode, decision ownership, constraints, and human approval at the moment they matter.

## Claims discipline

Do not say:

- “production proven”;
- “real merchant data”;
- “we increased conversion by X%” unless measured on real data;
- “Gemini made the purchase”;
- “the system guarantees the cheapest/best product” unless the relevant search space and objective are demonstrably exhaustive.

Say instead:

- synthetic catalog / prototype controls;
- measured evaluation result when you have one;
- Vertex AI serves Gemini 3.8 Flash through the Cloud Run service identity;
- deterministic budget/stock/policy validation;
- bounded optimization over eligible catalog candidates;
- human-confirmed purchase and merchant action.

## Pre-submission gate

Before recording the final video or presenting:

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Backend tests pass.
- [ ] `npm run test:e2e-smoke` passes.
- [ ] `npm run eval:commerce-guards` passes.
- [ ] `npm run eval:gemini` passes against the deployed Vertex AI runtime.
- [ ] Live path visibly reports `Google Vertex AI`; fallback is never presented as live-model evidence.
- [ ] Stockout rescue visibly shows validator → repair → revalidation.
- [ ] Attack test visibly blocks before model/tool execution.
- [ ] No secrets, PAN/CVV, personal demo images, or fabricated metrics appear in the recording.
- [ ] The 3-minute video follows one story instead of touring every feature.

## Deployment note

`deploy-gcp.ps1` deploys the frontend and backend to Cloud Run, enables Vertex AI, creates/uses a dedicated Vertex runtime service account, grants `roles/aiplatform.user`, and injects only non-model application secrets through Secret Manager. Confirm the deployed Cloud Run URL and live Vertex AI path immediately before submission.
