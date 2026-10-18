# Loopora Governance and Privacy

## Scope and accountability

Loopora supports product discovery, cart preparation, persistent order fulfillment, and merchant decision support. Gemini 3.8 Flash is served through Google Vertex AI and assists with interpretation, planning, ranking, explanation, and repair; deterministic application services retain authority over commerce facts and consequential actions.

## Cloud identity and model access

- Production model access uses a dedicated Cloud Run service identity rather than a Gemini API key.
- The runtime service account is granted `roles/aiplatform.user` for Vertex AI access.
- Vertex AI requests use short-lived Google Cloud access tokens obtained from the Cloud Run metadata service.
- No service-account private key is required or committed to the repository.
- A short-lived `VERTEX_ACCESS_TOKEN` is supported only for local evaluation/development.
- Secret Manager remains the boundary for database/JWT/demo application secrets; it is not used to store a model API key in the Vertex AI path.

## Data classification and minimization

| Data | Model use | Prototype handling |
|---|---|---|
| Catalog, price, aggregate order metrics | Grounding evidence | Application data |
| Email, phone, delivery address | Redacted or excluded | Used only where required by customer/order flows |
| Review text | Grounded merchant insight | Redacted and treated as untrusted content |
| Optional retail image | Vertex AI / Gemini visual interpretation | Request lifetime only in Loopora; not written to application storage |
| Credentials and raw payment numbers | Never permitted | Secrets remain server-side; Loopora does not collect PAN/CVV in demo mode |
| Synthetic payment token ID | Never model input | Stored only as explicitly simulated payment evidence |
| AI telemetry | Not model input | Metadata only: feature/provider/outcome/sizes, not raw sensitive prompts |

## Model and tool controls

- Gemini on Vertex AI receives bounded context and is instructed not to invent products, prices, stock, discounts, payment state, or safety guarantees.
- Browser-facing AI input is length bounded and request text passes through PII redaction.
- Customer/review text is treated as untrusted data.
- The model may request allow-listed planning tools; application code owns tool execution.
- Product IDs, prices, stock, budget, dietary tags, and policy are revalidated deterministically before display or continuation.
- Model output never authorizes payment, order creation, inventory mutation, cancellation, or fulfillment-state changes.
- Hidden chain-of-thought is neither exposed nor persisted. The UI shows bounded decision metadata instead.

## Human control

- Customers explicitly approve checkout and any proposed substitution.
- Merchants control fulfillment-state changes through an authenticated state machine.
- Merchant recommendations require human acceptance/rejection and do not directly mutate operational state.

## Failure behavior

- Vertex AI/model outage falls back transparently to deterministic catalog behavior.
- Prompt-injection test paths block before model access.
- Invalid or unknown tool calls are discarded.
- Failed plans must pass the same deterministic validators after repair.

## Payment boundary

The default hackathon flow uses an explicitly simulated one-time token or COD. No PAN/CVV is collected and no money is moved in demo mode.

## Prototype limitations

Catalogs, ratings, offers, inventory snapshots, merchant history, and forecasting evidence used for the demo are synthetic or directional. Dietary tags are not allergen guarantees. Model recommendations may be wrong. Production use would require a separate security, privacy, payment, retention, monitoring, and legal review.
