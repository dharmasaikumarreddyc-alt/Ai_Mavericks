import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Preloader from '../components/Preloader';
import LegacyPageBanner from '../components/LegacyPageBanner';
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

const architecture = [
  ['fa-user', 'Experience', 'Customer + merchant', 'Next.js routes, search, cart, order tracking and merchant workspace.'],
  ['fa-wand-magic-sparkles', 'Assistance', 'Gemini adapter', 'Bounded evidence, PII filtering and labelled deterministic fallback.'],
  ['fa-shield-halved', 'Control plane', 'FastAPI services', 'Auth, pricing, policy, payment verification and order state machine.'],
  ['fa-database', 'Operational data', 'PostgreSQL', 'Users, carts, orders, reviews and merchant action audit.'],
];

const checks = [
  ['21/21', 'Catalog retrieval cases', 'Passed locally'],
  ['8/8', 'Order transition cases', 'Passed locally'],
  ['7/7', 'Safety and payment controls', 'Passed locally'],
  ['10/10', 'Backend unit tests', 'Passed locally'],
];

const unknowns = [
  ['Live Gemini quality', 'Not verified', 'Requires a valid deployed Gemini credential and live evaluation run.'],
  ['Deployed p95 latency', 'Not measured', 'Local function timing is not production API latency.'],
  ['Business uplift', 'Not measured', 'Modeled interaction reduction is not a real-user conversion claim.'],
  ['Production forecast accuracy', 'Not measured', 'Synthetic held-out backtest is validation evidence, not production accuracy.'],
];

export default function EvidencePage() {
  return (
    <div className="page-wraper">
      <Preloader />
      <Header />
      <div className="page-content bg-light legacy-ai-surface">
        <LegacyPageBanner title="Evidence & Architecture" current="Evidence" parentHref="/copilot-lab" parentLabel="AI Shopping" />

        <section className="content-inner-1">
          <div className="container">
            <div className="row align-items-end g-4 mb-5">
              <div className="col-lg-8">
                <div className="section-head style-1 mb-0">
                  <span className="text-primary fw-bold text-uppercase legacy-eyebrow">Inspect the system</span>
                  <h2 className="title mt-2">Evidence before theatre.</h2>
                  <p className="mb-0">See what Gemini may propose, what deterministic software controls, what people approve, and what has actually been tested.</p>
                </div>
              </div>
              <div className="col-lg-4 text-lg-end">
                <div className="d-flex gap-2 flex-wrap justify-content-lg-end">
                  <Link className="btn btn-secondary" href="/copilot-lab">Run live copilot</Link>
                  <Link className="btn btn-outline-secondary" href="/trust">Trust & governance</Link>
                </div>
              </div>
            </div>

            <div className="section-head style-1 mb-4">
              <span className="text-primary fw-bold text-uppercase legacy-eyebrow">Control map</span>
              <h3 className="title mt-2">One workflow. Explicit ownership at every step.</h3>
            </div>
            <div className="row g-3">
              {workflow.map(([number, title, owner, body]) => (
                <div className="col-xl-3 col-lg-4 col-md-6" key={number}>
                  <article className="account-card h-100 legacy-evidence-card">
                    <span className="legacy-step-number">{number}</span>
                    <small className="text-primary fw-bold text-uppercase d-block mt-3">{owner}</small>
                    <h5 className="mt-2 mb-2">{title}</h5>
                    <p className="text-muted mb-0">{body}</p>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="content-inner bg-white border-top border-bottom">
          <div className="container">
            <div className="section-head style-1 mb-4">
              <span className="text-primary fw-bold text-uppercase legacy-eyebrow">Real architecture</span>
              <h3 className="title mt-2">AI proposes. Deterministic services commit.</h3>
              <p className="mb-0">No autonomous payment. No model-owned price, inventory or order-state authority.</p>
            </div>
            <div className="row g-3">
              {architecture.map(([icon, label, title, body]) => (
                <div className="col-xl-3 col-md-6" key={title}>
                  <article className="icon-bx-wraper style-4 h-100 legacy-architecture-card">
                    <div className="icon-bx-sm radius bg-primary mb-3"><i className={`fas ${icon} text-white`} /></div>
                    <small className="text-primary fw-bold text-uppercase">{label}</small>
                    <h5 className="mt-2">{title}</h5>
                    <p className="text-muted mb-0">{body}</p>
                  </article>
                </div>
              ))}
            </div>
            <div className="alert alert-info mt-4 mb-0">
              <i className="fas fa-circle-info me-2" /> Cloud Run and Secret Manager are deployment targets. A deployed production trace remains a release gate.
            </div>
          </div>
        </section>

        <section className="content-inner-1">
          <div className="container">
            <div className="section-head style-1 mb-4">
              <span className="text-primary fw-bold text-uppercase legacy-eyebrow">Reproducible offline evidence</span>
              <h3 className="title mt-2">Passed controls and unanswered questions stay separate.</h3>
            </div>

            <div className="row g-3 mb-4">
              {checks.map(([score, title, state]) => (
                <div className="col-lg-3 col-md-6" key={title}>
                  <article className="account-card h-100 border-success legacy-score-card">
                    <strong className="display-6 text-success">{score}</strong>
                    <h6 className="mt-3 mb-2">{title}</h6>
                    <p className="mb-0 text-success"><i className="fas fa-check-circle me-1" /> {state}</p>
                  </article>
                </div>
              ))}
              {unknowns.map(([title, state, detail]) => (
                <div className="col-lg-3 col-md-6" key={title}>
                  <article className="account-card h-100 legacy-score-card">
                    <strong className="display-6 text-muted">—</strong>
                    <h6 className="mt-3 mb-2">{title}</h6>
                    <p className="text-muted mb-0"><b>{state}</b> · {detail}</p>
                  </article>
                </div>
              ))}
            </div>

            <div className="account-card mb-4 legacy-command-card">
              <span className="fw-bold">Reproduce deterministic checks</span>
              <code className="d-block mt-2">python backend/run_evaluation.py</code>
              <small className="text-muted d-block mt-2">These results do not claim live-model quality, observed business impact, or deployed latency.</small>
            </div>

            <div className="account-card legacy-policy-card"><PolicySimulator /></div>
          </div>
        </section>
      </div>
      <Footer />
      <button className="scroltop" type="button" aria-label="Back to top"><i className="fas fa-arrow-up"></i></button>
    </div>
  );
}
