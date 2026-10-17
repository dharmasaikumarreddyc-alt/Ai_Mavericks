import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Preloader from '../components/Preloader';
import LegacyPageBanner from '../components/LegacyPageBanner';

export const metadata: Metadata = {
  title: 'Trust, Privacy & AI Governance',
  description: 'How Loopora protects personal data, grounds Gemini, and keeps people in control.',
};

const controls = [
  ['fa-user-shield', 'PII minimization', 'Email, phone, and payment-like numbers are redacted before AI calls and filtered from model output.'],
  ['fa-link', 'Grounded responses', 'Gemini receives bounded catalog and aggregate business evidence. Prices, budgets, and workflow transitions remain deterministic.'],
  ['fa-user-check', 'Human control', 'A customer must confirm checkout and payment mode. A merchant must explicitly advance each order; AI cannot authorize payment or dispatch an order.'],
  ['fa-credit-card', 'Payment minimization', 'Demo mode creates a synthetic one-time token and moves no money. The optional real adapter uses provider-hosted entry; Loopora stores no card number or CVV.'],
  ['fa-lock', 'Role isolation', 'JWT authorization separates customer data from merchant workspaces, with ownership checks on merchant operations.'],
  ['fa-chart-line', 'Safe telemetry', 'AI events record feature, provider, outcome, and size only—never prompt contents, credentials, or personal information.'],
  ['fa-rotate', 'Graceful fallback', 'If Gemini is unavailable or evidence is insufficient, the product gives a labelled evidence-based fallback instead of inventing an answer.'],
];

export default function TrustPage() {
  return (
    <div className="page-wraper">
      <Preloader />
      <Header />
      <div className="page-content bg-light legacy-ai-surface">
        <LegacyPageBanner title="Trust & AI Governance" current="Trust" />

        <section className="content-inner-1">
          <div className="container">
            <div className="row align-items-center g-4 mb-5">
              <div className="col-lg-8">
                <div className="section-head style-1 mb-0">
                  <span className="text-primary fw-bold text-uppercase legacy-eyebrow">Responsible AI by design</span>
                  <h2 className="title mt-2">Useful intelligence. People stay in control.</h2>
                  <p className="mb-0">Loopora connects shopping intent with merchant action while minimizing data, grounding recommendations, and requiring approval for consequential steps.</p>
                </div>
              </div>
              <div className="col-lg-4 text-lg-end">
                <div className="d-flex gap-2 flex-wrap justify-content-lg-end">
                  <Link className="btn btn-secondary" href="/cart-pilot">Try AI concierge</Link>
                  <Link className="btn btn-outline-secondary" href="/evidence">Inspect evidence</Link>
                </div>
              </div>
            </div>

            <div className="row g-3">
              {controls.map(([icon, title, body]) => (
                <div className="col-xl-4 col-md-6" key={title}>
                  <article className="icon-bx-wraper style-4 h-100 legacy-trust-card">
                    <div className="icon-bx-sm radius bg-primary mb-3"><i className={`fas ${icon} text-white`} /></div>
                    <h5>{title}</h5>
                    <p className="text-muted mb-0">{body}</p>
                  </article>
                </div>
              ))}
            </div>

            <div className="account-card mt-4 border-warning legacy-limit-card">
              <div className="d-flex gap-3 align-items-start">
                <i className="fas fa-triangle-exclamation text-warning fs-4 mt-1" />
                <div>
                  <h5>Transparent prototype limitations</h5>
                  <p className="mb-0 text-muted">The default tokenized-card experience is simulated and no money moves; COD is not collected. Catalog, offers, ratings, orders and analytics can be synthetic demo data. Forecasts are directional decision support. Availability must be verified by the merchant. AI output can be wrong and should be reviewed.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
      <button className="scroltop" type="button" aria-label="Back to top"><i className="fas fa-arrow-up"></i></button>
    </div>
  );
}
