# Loopora GenAI Architecture — Judge Evidence

Loopora is designed as a **governed agentic commerce system**, not a chatbot layered on checkout.

## Core control loop

```text
Customer text / optional image
        |
        v
Gemini perception
        |
        v
Gemini planner (custom function calling, medium reasoning)
        |
        v
Application-owned tools
  - search_catalog
  - check_inventory
  - validate_constraints
  - propose_substitution
        |
        v
Deterministic validator
  - catalog IDs
  - price
  - stock
  - budget
  - dietary selector
        |
   invalid? ---- yes ----> Gemini repair request
        |                       |
        |                       v
        |                deterministic re-validation
        v
Human confirmation
        |
        v
Existing authenticated order flow
```

## What Gemini owns

- Interpreting natural-language intent.
- Extracting useful cues from an optional pantry / shelf / meal image.
- Choosing which bounded application tools are useful.
- Ranking / proposing grounded candidates.
- Requesting a repair after validator feedback.
- Explaining recommendations.

## What Gemini never owns

- Source-of-truth product IDs.
- Prices or order totals.
- Inventory truth.
- Dietary/allergen guarantees.
- Authentication or authorization.
- Final checkout confirmation.
- Payment state or money movement.
- Order lifecycle transitions.
- Inventory mutations.
- Merchant operational changes.

All consequential commerce actions stay behind deterministic services and explicit human confirmation.

## Native Gemini function calling

`app/api/agents/llm.ts` uses the Gemini OpenAI-compatible chat-completions endpoint with custom `tools`, `tool_choice: "auto"`, and `reasoning_effort: "medium"`.

The model may request a function; Loopora parses only allow-listed tool names and JSON arguments. Invalid or unknown calls are discarded. Application code executes tools and validates every result.

The implementation deliberately does **not** expose or persist chain-of-thought. The UI shows a bounded decision trace instead: tool requested, component owner, validator result, fallback/repair state, and elapsed time.

## Validator → repair demonstration

The Copilot Lab's **Stockout rescue** scenario intentionally makes a selected item unavailable after the first plan.

1. Deterministic validator reports `out_of_stock:<catalog-id>`.
2. Gemini receives the validator error and can request `propose_substitution`.
3. Application code chooses a grounded substitute candidate from current catalog records.
4. The repaired basket is validated again for stock, budget and dietary rules.
5. The replacement remains a proposal and requires customer approval.

This is intentionally different from asking an LLM to "try again": the failure is machine-readable, authority remains deterministic, and the repaired output must pass the same controls.

## Multimodal path

The optional image is compressed in the browser, bounded by MIME type and payload size, and passed to Gemini's native multimodal `generateContent` endpoint. Gemini can extract visual cues, but every displayed product still has to resolve to the bounded application catalog.

Images are not written to Loopora application storage. Demo users are instructed to use non-sensitive images.

## Graceful degradation

When Gemini is unavailable, the commerce experience falls back to deterministic catalog matching. The UI labels this mode explicitly. No model outage can bypass price, budget, stock or confirmation checks.

The failure switch also demonstrates:

- model outage
- stockout / repair
- prompt-injection blocking
- normal live Gemini path

## Evaluation contract

Run:

```bash
npm run eval:gemini
```

The harness does not count deterministic fallback as successful live-model quality. It records:

- live Gemini cases
- agentic tool-planning evidence
- deterministic validator passes
- validator → repair cases
- prompt-injection blocks
- model-outage fallback
- budget compliance
- human-confirmation governance
- grounded basket intent signals

A valid `GOOGLE_API_KEY` is required to claim live Gemini results. Do not publish a score until the harness has been run against the deployed build with a valid key.

## Judge-friendly summary

> Loopora uses Gemini as the reasoning and orchestration layer, not as the commerce authority. Gemini perceives intent, chooses bounded tools and can repair a rejected plan; deterministic services retain authority over catalog, price, inventory, policy and order state; humans remain in control of consequential actions.

This architecture is intended to demonstrate meaningful GenAI through **multimodality + custom tool use + model reasoning + deterministic grounding + machine-verifiable repair + graceful degradation + human oversight**.
