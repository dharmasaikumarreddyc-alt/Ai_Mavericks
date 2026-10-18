'use client';

import Link from 'next/link';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';

type Scenario = 'normal' | 'model-outage' | 'stockout' | 'prompt-injection';

interface TraceStep {
  id: string;
  label: string;
  owner: string;
  status: 'passed' | 'fallback' | 'blocked' | 'required';
  durationMs: number;
  detail: string;
}

interface BasketItem {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  merchantId: string;
  merchantName: string;
  dietaryTags: string[];
  reason: string;
  confidence: number;
  evidence: string[];
  substitution: { for: string; requiresCustomerApproval: boolean } | null;
}

interface CopilotResult {
  success: true;
  timestamp: string;
  mode: 'gemini-multimodal' | 'deterministic-fallback';
  model: { provider: string; model: string } | null;
  summary: string;
  detectedItems: string[];
  constraints: string[];
  basket: BasketItem[];
  totals: { subtotal: number; budget: number; remaining: number; withinBudget: boolean };
  merchantAction: { title: string; rationale: string; evidence: string[]; status: string } | null;
  trace: TraceStep[];
  governance: {
    piiRedactions: number;
    imageReceived: boolean;
    imageRetention: string;
    catalogBoundary: string;
    customerConfirmationRequired: boolean;
    autonomousChanges: boolean;
  };
  limitations: string[];
  processingMs: number;
}

interface ApiError {
  success: false;
  blocked?: boolean;
  error: string;
  trace?: TraceStep[];
}

interface PreparedImage {
  preview: string;
  mimeType: string;
  data: string;
  sizeKb: number;
}

const scenarioCopy: Record<Scenario, { label: string; detail: string }> = {
  normal: { label: 'Live path', detail: 'Use Gemini when configured, then validate every commerce fact.' },
  'model-outage': { label: 'Model outage', detail: 'Prove deterministic fallback without pretending the image was understood.' },
  stockout: { label: 'Stockout rescue', detail: 'Make the first match unavailable and require approval for its substitute.' },
  'prompt-injection': { label: 'Attack test', detail: 'Block an injection before any model or commerce action runs.' },
};

async function prepareImage(file: File): Promise<PreparedImage> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.');
  }
  if (file.size > 8 * 1024 * 1024) throw new Error('Choose an image smaller than 8 MB.');

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await image.decode();
    const scale = Math.min(1, 900 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser could not prepare the image.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let quality = 0.78;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (dataUrl.length > 590_000 && quality > 0.42) {
      quality -= 0.08;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    const data = dataUrl.split(',')[1] || '';
    if (!data || data.length > 600_000) throw new Error('The compressed image is still too large. Try a smaller photo.');
    return { preview: dataUrl, mimeType: 'image/jpeg', data, sizeKb: Math.round(data.length * 0.75 / 1024) };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function CopilotLabClient() {
  const [request, setRequest] = useState('Build a vegan breakfast with coffee under $20. Prefer something healthy.');
  const [budget, setBudget] = useState(20);
  const [dietary, setDietary] = useState<'none' | 'vegetarian' | 'vegan'>('vegan');
  const [scenario, setScenario] = useState<Scenario>('normal');
  const [preparedImage, setPreparedImage] = useState<PreparedImage | null>(null);
  const [result, setResult] = useState<CopilotResult | null>(null);
  const [failure, setFailure] = useState<ApiError | null>(null);
  const [running, setRunning] = useState(false);
  const [imageError, setImageError] = useState('');
  const [merchantDecision, setMerchantDecision] = useState<'pending' | 'accepted' | 'rejected'>('pending');
  const fileInput = useRef<HTMLInputElement>(null);

  const onImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError('');
    try {
      setPreparedImage(await prepareImage(file));
    } catch (error) {
      setPreparedImage(null);
      setImageError(error instanceof Error ? error.message : 'Could not prepare that image.');
    }
  };

  const loadSample = async () => {
    setImageError('');
    try {
      const response = await fetch('/images/products/breakfast-platter.jpg');
      if (!response.ok) throw new Error('Sample image is unavailable.');
      const blob = await response.blob();
      setPreparedImage(await prepareImage(new File([blob], 'synthetic-breakfast-sample.jpg', { type: blob.type || 'image/jpeg' })));
    } catch (error) {
      setImageError(error instanceof Error ? error.message : 'Could not load the sample image.');
    }
  };

  const runCopilot = async (event: FormEvent) => {
    event.preventDefault();
    setRunning(true);
    setResult(null);
    setFailure(null);
    setMerchantDecision('pending');
    try {
      const response = await fetch('/api/agents/retail-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request,
          budget,
          dietary,
          scenario,
          image: preparedImage ? { mimeType: preparedImage.mimeType, data: preparedImage.data } : undefined,
        }),
      });
      const payload = await response.json() as CopilotResult | ApiError;
      if (!response.ok || !payload.success) {
        setFailure(payload as ApiError);
        return;
      }
      setResult(payload as CopilotResult);
    } catch {
      setFailure({ success: false, error: 'The copilot endpoint is unavailable. No action was taken.' });
    } finally {
      setRunning(false);
    }
  };

  const checkoutRequest = result?.basket.length
    ? `${request} Selected catalog items: ${result.basket.map((item) => item.name).join(', ')}.`
    : request;
  const shownTrace = result?.trace || failure?.trace || [];

  return (
    <>
      <section className="copilot-hero">
        <div className="container copilot-hero-grid">
          <div>
            <p className="copilot-eyebrow"><span /> LIVE GOVERNED EXPERIENCE</p>
            <h1>Show Gemini a retail moment. See every decision.</h1>
            <p className="copilot-lede">
              Upload a pantry, shelf, meal, or product image. Loopora turns visual and text intent into a catalog-grounded basket, rescues stockouts, and proposes a merchant action—without silently changing an order or moving money.
            </p>
          </div>
          <div className="copilot-hero-facts" aria-label="Safety boundaries">
            <span><i className="fas fa-eye" /> Multimodal Gemini</span>
            <span><i className="fas fa-link" /> Catalog-grounded</span>
            <span><i className="fas fa-user-check" /> Human-confirmed</span>
            <small>Synthetic catalog · prototype controls · no autonomous payment</small>
          </div>
        </div>
      </section>

      <section className="container copilot-workbench" aria-labelledby="workbench-title">
        <div className="copilot-section-title">
          <div><p>01 / GIVE IT A MISSION</p><h2 id="workbench-title">Customer intent in. Verifiable plan out.</h2></div>
          <span>Images are held in browser memory and sent only when you run the copilot.</span>
        </div>

        <form className="copilot-input-card" onSubmit={runCopilot}>
          <div className="copilot-image-panel">
            {preparedImage ? (
              <div className="copilot-image-preview">
                <img src={preparedImage.preview} alt="Selected retail context preview" />
                <div><span>{preparedImage.sizeKb} KB prepared</span><button type="button" onClick={() => setPreparedImage(null)}>Remove</button></div>
              </div>
            ) : (
              <button className="copilot-drop" type="button" onClick={() => fileInput.current?.click()}>
                <i className="fas fa-camera" />
                <strong>Add visual context</strong>
                <span>Pantry, shelf, meal, or product photo</span>
                <small>JPEG, PNG, WebP · compressed locally</small>
              </button>
            )}
            <input ref={fileInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={onImage} />
            {!preparedImage && <button className="copilot-sample" type="button" onClick={loadSample}>Use synthetic sample image</button>}
            <p className="copilot-image-warning"><i className="fas fa-shield-halved" /> Use non-sensitive demo images only. Visual PII cannot be redacted before model processing.</p>
            {imageError && <p className="copilot-field-error" role="alert">{imageError}</p>}
          </div>

          <div className="copilot-mission-panel">
            <label htmlFor="copilot-request">What outcome do you want?</label>
            <textarea id="copilot-request" value={request} maxLength={600} onChange={(event) => setRequest(event.target.value)} />
            <div className="copilot-fields">
              <label>Budget ceiling<span><b>$</b><input type="number" min="3" max="500" step="1" value={budget} onChange={(event) => setBudget(Number(event.target.value))} /></span></label>
              <label>Dietary tag<select value={dietary} onChange={(event) => setDietary(event.target.value as typeof dietary)}><option value="none">None</option><option value="vegetarian">Vegetarian</option><option value="vegan">Vegan</option></select></label>
            </div>
            <button className="copilot-run" type="submit" disabled={running || !request.trim()}>
              {running ? <><i className="fas fa-circle-notch fa-spin" /> Running guarded pipeline…</> : <><i className="fas fa-wand-magic-sparkles" /> Run retail copilot</>}
            </button>
          </div>
        </form>

        <fieldset className="copilot-failure-switch">
          <legend>Demo failure switch <span>— prove resilience live</span></legend>
          <div>
            {(Object.keys(scenarioCopy) as Scenario[]).map((key) => (
              <label key={key} className={scenario === key ? 'is-selected' : ''}>
                <input type="radio" name="scenario" value={key} checked={scenario === key} onChange={() => setScenario(key)} />
                <strong>{scenarioCopy[key].label}</strong><small>{scenarioCopy[key].detail}</small>
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      {(result || failure) && (
        <section className="copilot-results" aria-live="polite">
          <div className="container">
            <div className="copilot-section-title is-dark">
              <div><p>02 / INSPECT THE DECISION</p><h2>{failure?.blocked ? 'The guardrail stopped the run.' : 'A basket you can interrogate.'}</h2></div>
              {result && <span className={`copilot-mode ${result.mode === 'gemini-multimodal' ? 'is-live' : ''}`}>{result.mode === 'gemini-multimodal' ? `${result.model?.provider} · ${result.model?.model}` : 'Labelled deterministic fallback'}</span>}
            </div>

            {failure ? (
              <div className="copilot-blocked"><i className="fas fa-shield-halved" /><div><strong>{failure.blocked ? 'Blocked before model access' : 'Run unavailable'}</strong><p>{failure.error}</p><small>No cart, order, inventory, or payment state changed.</small></div></div>
            ) : result && (
              <>
                <div className="copilot-summary-grid">
                  <article className="copilot-summary">
                    <span>INTERPRETED NEED</span><p>{result.summary}</p>
                    <div>{result.constraints.map((constraint) => <b key={constraint}>{constraint}</b>)}</div>
                    {result.detectedItems.length > 0 && <small>Visual cues: {result.detectedItems.join(', ')}</small>}
                  </article>
                  <article className="copilot-budget">
                    <span>DETERMINISTIC TOTAL</span><strong>${result.totals.subtotal.toFixed(2)}</strong>
                    <p>${result.totals.remaining.toFixed(2)} under the ${result.totals.budget.toFixed(2)} ceiling</p>
                    <i className="fas fa-check" />
                  </article>
                </div>

                <div className="copilot-basket">
                  {result.basket.map((item) => (
                    <article key={item.id}>
                      <div className="copilot-product-image"><img src={item.image} alt="" /><span>{result.mode === 'gemini-multimodal' ? 'Gemini-guided · deterministic grounding' : 'Deterministic fallback match'}</span></div>
                      <div className="copilot-product-body">
                        {item.substitution && <p className="copilot-substitution"><i className="fas fa-arrows-rotate" /> Substitute for {item.substitution.for} · approval required</p>}
                        <small>{item.merchantName} · {item.id}</small>
                        <h3>{item.name}</h3>
                        <p>{item.reason}</p>
                        <div className="copilot-evidence-list">{item.evidence.map((evidence) => <span key={evidence}><i className="fas fa-check" /> {evidence}</span>)}</div>
                        <div className="copilot-product-foot"><strong>${item.price.toFixed(2)}</strong><Link href={`/shop/${item.id}`}>Inspect record <i className="fas fa-arrow-right" /></Link></div>
                      </div>
                    </article>
                  ))}
                  {result.basket.length === 0 && <div className="copilot-empty">No catalog item passed every constraint. Widen the budget or request; nothing was invented.</div>}
                </div>
              </>
            )}

            {shownTrace.length > 0 && (
              <div className="copilot-trace">
                <div className="copilot-trace-head"><div><p>LIVE DECISION TRACE</p><h3>Who decided what?</h3></div>{result && <span>{result.processingMs} ms server pipeline</span>}</div>
                <ol>{shownTrace.map((step, index) => <li key={step.id} className={`is-${step.status}`}><span>{String(index + 1).padStart(2, '0')}</span><div><small>{step.owner} · {step.durationMs} ms</small><strong>{step.label}</strong><p>{step.detail}</p></div><b>{step.status}</b></li>)}</ol>
              </div>
            )}
          </div>
        </section>
      )}

      {result && (
        <section className="container copilot-close-loop">
          <div className="copilot-section-title"><div><p>03 / CLOSE THE LOOP</p><h2>One request, two responsible decisions.</h2></div></div>
          <div className="copilot-loop-grid">
            <article className="copilot-customer-decision">
              <span>CUSTOMER CONTROL</span><h3>Nothing enters checkout silently.</h3>
              <p>Review substitutions and product records, then continue to the existing customer-confirmed order flow.</p>
              {result.basket.length > 0
                ? <Link className="btn btn-secondary" href={`/cart-pilot?request=${encodeURIComponent(checkoutRequest)}`}>Continue to governed checkout <i className="fas fa-arrow-right" /></Link>
                : <button className="btn btn-secondary" type="button" disabled>No valid basket to continue</button>}
              <small>Checkout still requires authentication and explicit payment-method confirmation.</small>
            </article>
            <article className="copilot-merchant-decision">
              <span>MERCHANT CONTROL · SYNTHETIC SIGNAL</span>
              {result.merchantAction ? <><h3>{result.merchantAction.title}</h3><p>{result.merchantAction.rationale}</p><ul>{result.merchantAction.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
                {merchantDecision === 'pending' ? <div><button type="button" onClick={() => setMerchantDecision('accepted')}>Accept for staff review</button><button type="button" onClick={() => setMerchantDecision('rejected')}>Dismiss</button></div> : <div className={`copilot-decision-state is-${merchantDecision}`}><i className={`fas fa-${merchantDecision === 'accepted' ? 'user-check' : 'xmark'}`} /> {merchantDecision === 'accepted' ? 'Accepted for review—not automatically executed.' : 'Dismissed—no operational state changed.'}</div>}
              </> : <><h3>No merchant action proposed</h3><p>The request did not provide enough evidence for an operational suggestion.</p></>}
              <Link href="/merchant/login">Open persistent merchant workspace <i className="fas fa-arrow-right" /></Link>
            </article>
          </div>

          <div className="copilot-governance">
            <div><i className="fas fa-shield-halved" /><strong>Governance receipt</strong></div>
            <ul>
              <li>{result.governance.catalogBoundary}</li>
              <li>{result.governance.imageRetention}</li>
              <li>{result.governance.piiRedactions} request-level PII redaction event{result.governance.piiRedactions === 1 ? '' : 's'}.</li>
              {result.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
            </ul>
            <Link href="/trust">Read the complete trust boundary <i className="fas fa-arrow-right" /></Link>
          </div>
        </section>
      )}
    </>
  );
}
