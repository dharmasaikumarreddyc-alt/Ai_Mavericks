# Google AI Builder Cup Jury Checklist

## Technical merit and GenAI (40%)

- [ ] Deployed customer flow visibly uses Gemini, not a fallback provider.
- [ ] Demo one ambiguous request, one constrained/budget request, and one prompt-injection attempt.
- [ ] Explain that the model selects/reasons while catalog, pricing, authentication, and order transitions are deterministic.
- [ ] Show persistent customer-to-merchant status synchronization.
- [ ] Capture production build, unit-test, and five end-to-end smoke-test results.

## Problem alignment and impact (25%)

- [ ] Quantify customer time/click reduction on at least 20 synthetic scenarios.
- [ ] Back-test directional forecast against held-out synthetic days and report sample size/error.
- [ ] Connect every demo moment to discovery, personalization, demand insight, or operations.

## Innovation and creativity (25%)

- [ ] Lead with the closed-loop differentiator—not “another chatbot.”
- [ ] Show how post-order signals improve the merchant action layer.
- [ ] Demonstrate customer and merchant experiences in the same story.

## UX and solution design (10%)

- [ ] Confirm mobile layout, empty/loading/error states, keyboard navigation, and readable contrast.
- [ ] Keep the demo path under 2 minutes 30 seconds so architecture and safeguards fit under 3 minutes.

## Evidence and honesty gate

- [ ] Call the default card path “simulated tokenization”; never claim collected payment, PCI compliance, guaranteed inventory/forecasts, or production scale.
- [ ] Identify demo/synthetic data on screen and in the deck.
- [ ] Verify repository and screenshots contain no credentials or personal data.
- [ ] Rotate all previously shared keys and passwords; store replacements in Secret Manager.
