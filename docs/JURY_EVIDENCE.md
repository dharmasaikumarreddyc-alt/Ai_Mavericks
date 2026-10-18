# Loopora — Jury Evidence Map

This page is a fast audit trail for AI Builder Cup reviewers. It maps the submission's strongest claims to code and reproducible checks while keeping prototype limitations explicit.

## 1. Meaningful Google GenAI use

**Claim:** Gemini is used for retail intent/image interpretation, bounded function-call planning, and validator-guided stockout repair.

**Inspect:**
- `app/api/agents/retail-copilot/route.ts`
- `app/api/agents/llm.ts`
- `docs/GENAI_ARCHITECTURE.md`

**Reproduce:**
```bash
npm run eval:gemini
```

The live evaluator requires a valid Google Gemini credential for non-fallback cases. It verifies the Google Gemini provider, an actual bounded function-call request for agentic cases, application catalog-grounding evidence, deterministic validation, and—on the stockout case—a verified Gemini substitution request followed by successful deterministic revalidation.

Selected cases also declare an expected `search_catalog` tool request so a generic trace record is not enough to receive credit.

## 2. Model authority is deliberately bounded

**Claim:** The model does not own catalog identity, price, stock truth, totals, payment state, order state, or consequential merchant actions.

**Inspect:**
- `app/api/agents/retail-copilot/route.ts`
- `app/api/agents/guardrails.ts`
- `docs/GOVERNANCE.md`

The application re-resolves model proposals against the bounded catalog and recomputes budget/stock/policy checks. Human confirmation remains required before consequential commerce actions.

## 3. Invalid plans are repaired, not silently trusted

**Claim:** A stockout can invalidate a proposal, trigger bounded Gemini repair planning, and then pass through deterministic validation again.

**Inspect:**
- `app/api/agents/retail-copilot/route.ts` (`repair-plan`, `validator-2` trace steps)
- `evidence/gemini_cases.json` (`stockout-rescue`)
- `scripts/evaluate_gemini.mjs`

A substitution remains a proposal and carries customer-approval metadata rather than silently mutating checkout state.

## 4. Prompt injection and PII boundaries

**Claim:** obvious prompt-injection patterns are blocked before model/tool access and common PII patterns are redacted before model input.

**Inspect:**
- `app/api/agents/guardrails.ts`
- `app/api/agents/retail-copilot/route.ts`
- `evidence/gemini_cases.json`

The live corpus includes prompt-exfiltration attempts and a PII-bearing shopping request.

## 5. Graceful model outage

**Claim:** model failure does not bypass commerce controls and is not presented as live Gemini output.

**Inspect:**
- `evidence/gemini_cases.json` (`model-outage`)
- `scripts/evaluate_gemini.mjs`
- `docs/EVALUATION.md`

The evaluator explicitly requires `deterministic-fallback` for the outage scenario and refuses to count fallback as live-model quality.

## 6. Deterministic commerce regressions

**Reproduce:**
```bash
npm run eval:commerce-guards
npm run test:e2e-smoke
```

These checks are intentionally reported separately from live Gemini quality. They cover commerce invariants such as budget enforcement, merchant caps, optimization propagation, and fail-closed invalid constraints.

## 7. Impact evidence without inflated claims

**Inspect / reproduce:**
```bash
python backend/evidence/impact_benchmark.py
python backend/evidence/forecast_backtest.py
```

The interaction benchmark and forecasting backtest use declared synthetic/modelled data. They are supporting prototype evidence, not claims of observed production conversion, revenue lift, human time savings, or production forecast accuracy.

## 8. CI and build gate

`.github/workflows/ci.yml` runs production build, branding checks, full-stack smoke, deterministic commerce regressions, lint, backend unit tests, evidence benchmarks, Python compilation, and migration rehearsal.

A reviewer should rely on the current commit's actual CI result rather than a README statement about a historical run.

## 9. Data and demo disclosure

Catalog, stock counts, merchant records/history, offers, and forecast inputs are synthetic or directional prototype data. Dietary tags are not allergen guarantees. Optional user images are bounded and are not persisted by Loopora application storage.

## 10. What this evidence does *not* claim

- It does not guarantee competition placement or production readiness.
- It does not claim real-world conversion/revenue uplift without a real study.
- It does not treat deterministic fallback as successful Gemini behavior.
- It does not treat the existence of an `agent-tools` trace entry alone as proof of tool planning.
- It does not expose or depend on chain-of-thought.
- It does not give Gemini authority to mutate price, inventory, payment, order, or merchant operational state.

## Recommended judge story

Use one coherent path rather than a feature tour:

**customer intent → Gemini interpretation/tool request → application grounding → deterministic validation → stockout feedback → Gemini repair request → revalidation → human confirmation → merchant evidence**.

That path demonstrates the core differentiator: GenAI handles ambiguity and planning while deterministic systems retain commerce truth and humans retain consequential authority.
