import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PolicySimulator from './PolicySimulator';

export const metadata: Metadata = {
  title: 'Evidence & Architecture',
  description: 'Inspect Loopora workflow ownership, verified offline controls, architecture, and prototype limitations.',
};

const workflow = [
  ['01', 'Understand intent', 'Gemini or labelled fallback', 'Natural-language goal becomes bounded shopping constraints.'],
  ['02', 'Retrieve evidence', 'Application catalog', 'Only known merchants, products, tags, prices, and availability snapshots enter the candidate set.'],
  ['03', 'Compose proposal', 'Gemini-assisted', 'The model can explain and rank; it cannot create products, change prices, or authorize actions.'],
  ['04', 'Validate basket', 'Deterministic code', 'IDs, quantities, totals, budget ceilings, and policy rules are recomputed by the application.'],
  ['05', 'Confirm checkout', 'Customer', 'The user sees the total, provenance, payment status, and must explicitly approve.'],
  ['06', 'Fulfil order', 'Merchant + state machine', 'Authenticated staff advance only permitted order states. AI cannot dispatch or collect payment.'],
  ['07', 'Review outcomes', 'Merchant', 'Directional insights become auditable recommendations accepted for staff review.'],
];

const checks = [
  ['21/21', 'Catalog retrieval cases', 'Passed locally'],
  ['8/8', 'Order transition cases', 'Passed locally'],
  ['7/7', 'Safety and payment controls', 'Passed locally'],
  ['10/10', 'Backend unit tests', 'Passed locally'],
];

const unknowns = [
  ['Live Gemini quality', 'Not verified', 'The supplied credential currently returns HTTP 403.'],
  ['Deployed p95 latency', 'Not measured', 'Local function timing is not production API latency.'],
  ['Business uplift', 'Not measured', 'No conversion, waste, or revenue claim is made.'],
  ['Forecast error', 'Not back-tested', 'Forecasts remain directional decision support.'],
];

export default function EvidencePage() {
  return (
    <div className="page-wraper">
      <Header />
      <main className="aisle-evidence-page">
        <section className="aisle-evidence-hero">
          <div className="container">
            <p className="aisle-evidence-kicker">INSPECT THE SYSTEM</p>
            <h1>Evidence before theatre.</h1>
            <p>A transparent view of what Gemini may decide, what deterministic software controls, what people approve, and what has actually been tested.</p>
            <div className="aisle-home-actions">
              <Link className="btn btn-light" href="/copilot-lab">Run the live copilot</Link>
              <Link className="btn btn-outline-light" href="/trust">Read governance</Link>
            </div>
          </div>
        </section>

        <section className="container aisle-evidence-section" aria-labelledby="workflow-title">
          <div className="aisle-evidence-section-head">
            <div><p>CONTROL MAP</p><h2 id="workflow-title">One workflow. Explicit ownership at every step.</h2></div>
            <span className="aisle-evidence-badge">CLOSED LOOP</span>
          </div>
          <ol className="aisle-workflow-list">
            {workflow.map(([number, title, owner, body]) => (
              <li key={number}>
                <span>{number}</span>
                <div><small>{owner}</small><h3>{title}</h3><p>{body}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="aisle-architecture-section" aria-labelledby="architecture-title">
          <div className="container">
            <div className="aisle-evidence-section-head is-light">
              <div><p>REAL ARCHITECTURE</p><h2 id="architecture-title">AI proposes. Deterministic services commit.</h2></div>
              <span className="aisle-evidence-badge">NO AUTONOMOUS PAYMENT</span>
            </div>
            <div className="aisle-architecture-flow" role="img" aria-label="Customer and merchant interfaces connect through Next.js, governed Gemini assistance, FastAPI controls, and PostgreSQL operational data">
              <article><i className="fas fa-user" /><small>EXPERIENCE</small><h3>Customer + merchant</h3><p>Next.js routes, search, cart, order tracking, dashboard</p></article>
              <b aria-hidden="true">→</b>
              <article className="is-ai"><i className="fas fa-wand-magic-sparkles" /><small>ASSISTANCE</small><h3>Gemini adapter</h3><p>Bounded evidence, PII filtering, labelled deterministic fallback</p></article>
              <b aria-hidden="true">→</b>
              <article className="is-control"><i className="fas fa-shield-halved" /><small>CONTROL PLANE</small><h3>FastAPI services</h3><p>Auth, pricing, policy, payment verification, order state machine</p></article>
              <b aria-hidden="true">→</b>
              <article><i className="fas fa-database" /><small>OPERATIONAL DATA</small><h3>PostgreSQL</h3><p>Users, carts, orders, reviews, merchant action audit</p></article>
            </div>
            <p className="aisle-architecture-note"><i className="fas fa-circle-info" /> Cloud Run and Secret Manager are deployment targets. A deployed production trace is still a release gate.</p>
          </div>
        </section>

        <section className="container aisle-evidence-section" aria-labelledby="evaluation-title">
          <div className="aisle-evidence-section-head">
            <div><p>REPRODUCIBLE OFFLINE EVIDENCE</p><h2 id="evaluation-title">Passed controls and unanswered questions stay separate.</h2></div>
            <span className="aisle-evidence-badge is-pass">36 / 36 PASSED</span>
          </div>
          <div className="aisle-evaluation-grid">
            {checks.map(([score, title, state]) => <article className="is-verified" key={title}><strong>{score}</strong><h3>{title}</h3><p><i className="fas fa-check-circle" /> {state}</p></article>)}
            {unknowns.map(([title, state, detail]) => <article className="is-open" key={title}><strong>—</strong><h3>{title}</h3><p><b>{state}</b> · {detail}</p></article>)}
          </div>
          <div className="aisle-evaluation-command"><span>Reproduce the offline checks</span><code>python backend/run_evaluation.py</code><small>These results do not claim live-model quality, business impact, or deployed latency.</small></div>
        </section>

        <div className="container aisle-evidence-section"><PolicySimulator /></div>
      </main>
      <Footer />
    </div>
  );
}
