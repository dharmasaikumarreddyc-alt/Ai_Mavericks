# Loopora Governance and Privacy

## Scope and accountability

Loopora supports product discovery, cart preparation, and merchant decision support. The product owner is accountable for deployment, access reviews, incident response, and validating model or policy changes before release.

## Data classification and minimization

| Data | Classification | Model use | Retention |
|---|---|---|---|
| Catalog, price, aggregate order metrics | Business | Grounding evidence | While merchant is active |
| Email, phone, delivery address | Personal | Redacted or excluded | Until account/order deletion policy applies |
| Review text | User-generated | Redacted and treated as untrusted | With the review record |
| Optional retail image | User-provided | Gemini visual interpretation | Browser memory and request lifetime only in Loopora; provider handling follows Gemini API terms |
| Credentials and raw payment numbers | Restricted | Never permitted | Secrets in Secret Manager; Loopora never stores PAN/CVV |
| Synthetic payment token ID | Demo | Never model input | Stored with the demo order; explicitly marked simulated |
| AI telemetry | Operational | Not model input | Feature/provider/outcome/sizes only; 30-day target |

## Safety controls

- Gemini receives bounded evidence plus a policy that prohibits invented products, prices, inventory, discounts, payments, and guarantees.
- Email, phone, and payment-like values are redacted before model calls and filtered from outputs.
- Review and customer text is treated as untrusted content to reduce prompt-injection risk.
- Optional images are compressed in the browser, restricted to JPEG/PNG/WebP, bounded at both proxy and route layers, sent only on explicit submission, and never written to Loopora storage or logs.
- Multimodal output is only a proposal: product IDs, current price, dietary tags, stock state, and budget are revalidated against the bounded catalog before display.
- The live failure switch demonstrates model outage, stockout substitution, and injection blocking; it cannot bypass authentication or mutate commerce state.
- Checkout requires explicit customer confirmation. Fulfillment uses a deterministic, merchant-authorized state machine.
- Demo card checkout never renders a PAN/CVV field, creates a synthetic one-time token, reports `simulated`, and moves no money. COD reports `not_collected`.
- The disabled-by-default Razorpay adapter creates the provider order server-side and verifies signature, captured state, order ID, amount, and currency before order creation.
- AI failures fall back to transparent evidence-based behavior instead of blocking checkout or fabricating an answer.
- Customer and merchant tokens are kept separate, records are ownership-scoped, and sensitive endpoints return `no-store`.
- Browser-facing AI routes reject cross-site requests and oversized payloads and apply a best-effort per-instance burst limit.
- The in-process limit is not a distributed quota. Production must also enforce managed API/edge quotas and billing alerts.

## Model risk and evaluation

Evaluate representative shopping requests for catalog grounding, price arithmetic, budget adherence, unsafe disclosure, prompt injection, and tool-selection accuracy. Evaluate merchant insights for evidence citation, unsupported causal claims, and actionable specificity. Record test inputs without real PII.

## Human oversight and incidents

Users can decline a prepared cart; merchants control status changes. Suspected leakage, unauthorized access, or harmful output should disable the affected feature, preserve metadata-only audit evidence, rotate impacted credentials, notify owners, and be reviewed before restoration.

## Known limitations

The default prototype does not collect payment: tokenization is simulated and COD is unpaid. It does not guarantee inventory or forecasts. Catalogs, ratings, offers and merchant-history analytics are synthetic. Gemini recommendations can be wrong. Production use requires secure cookie-based sessions, reviewed retention/deletion procedures, managed edge rate limiting, observability alerts, provider webhooks, and payment/legal/security review.
