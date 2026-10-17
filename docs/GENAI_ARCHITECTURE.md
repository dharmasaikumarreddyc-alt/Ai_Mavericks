# Loopora GenAI Architecture

Loopora is a governed agentic commerce system rather than a chatbot layered on checkout.

## Core control loop

```text
Customer text / optional image
        ↓
Gemini perception
        ↓
Gemini planner / bounded tool requests
        ↓
Application-owned commerce tools
        ↓
Deterministic validator
        ↓
Repair when required
        ↓
Human confirmation
        ↓
Authenticated order flow
        ↓
Merchant evidence + Gemini-assisted insight
        ↓
Human-reviewed merchant action
```

## Gemini responsibilities

- Interpret natural-language intent.
- Extract useful cues from optional retail images.
- Request bounded planning tools.
- Rank and explain grounded candidates.
- Request a repair after machine-readable validator feedback.
- Summarize grounded merchant evidence.

## Deterministic application responsibilities

- Product identity and catalog membership.
- Prices and totals.
- Inventory truth.
- Budget and dietary-tag validation.
- Authentication and authorization.
- Payment state.
- Order creation and lifecycle transitions.
- Inventory and merchant operational mutations.

## Tool boundary

The retail copilot exposes allow-listed planning capabilities such as catalog search, inventory checking, constraint validation, and substitution requests. Gemini can request those capabilities, but the application validates tool names and arguments and remains responsible for execution and commerce truth.

Unknown, malformed, or unsafe calls do not gain operational authority.

## Validator and repair

A proposed basket is checked against current application data. A failed plan can produce machine-readable feedback such as an unavailable SKU or policy violation. Gemini may request a bounded repair, after which deterministic validation runs again. Substitutions remain proposals until the customer approves them.

## Multimodal path

Optional JPEG/PNG/WebP input is compressed client-side and bounded again on the server. Gemini may extract retail cues from the image, but displayed products still have to resolve to application-owned catalog records.

Loopora does not persist uploaded images in application storage.

## Decision trace

The judge-facing trace shows:

- component owner
- requested capability
- validation result
- fallback/repair state
- elapsed time
- human approval requirement

It intentionally does not reveal model chain-of-thought.

## Graceful degradation

When Gemini is unavailable, deterministic catalog matching remains available and is labelled as fallback. Model failure cannot bypass price, stock, budget, authentication, or human approval controls.

## Evaluation

`npm run eval:gemini` evaluates representative and adversarial cases. Deterministic fallback is not counted as successful live-model quality. Offline application checks are kept separate from live Gemini evaluation so synthetic/control evidence is not presented as model-quality evidence.
