import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata: Metadata = {
  title: 'Trust, Privacy & AI Governance',
  description: 'How Aisle AI protects personal data, grounds Gemini, and keeps people in control.',
};

const controls = [
  ['PII minimization', 'Email, phone, and payment-like numbers are redacted before AI calls and filtered from model output.'],
  ['Grounded responses', 'Gemini receives bounded catalog and aggregate business evidence. Prices, budgets, and workflow transitions remain deterministic.'],
  ['Human control', 'A customer must confirm checkout and payment mode. A merchant must explicitly advance each order; AI cannot authorize payment or dispatch an order.'],
  ['Payment minimization', 'Demo mode creates a synthetic one-time token and moves no money. The optional real adapter uses provider-hosted entry; Aisle stores no card number or CVV.'],
  ['Role isolation', 'JWT authorization separates customer data from merchant workspaces, with ownership checks on every merchant operation.'],
  ['Safe telemetry', 'AI events record feature, provider, outcome, and size only—never prompt contents, credentials, or personal information.'],
  ['Graceful fallback', 'If Gemini is unavailable or evidence is insufficient, the product gives an evidence-based fallback instead of inventing an answer.'],
];

export default function TrustPage() {
  return <div className="page-wraper"><Header /><main className="aisle-trust-page">
    <div className="container">
      <p className="merchant-eyebrow">RESPONSIBLE AI BY DESIGN</p>
      <h1>Useful intelligence. People stay in control.</h1>
      <p className="aisle-trust-lead">Aisle AI connects shopping intent with merchant action while minimizing data, grounding recommendations, and requiring approval for consequential steps.</p>
      <div className="aisle-trust-grid">{controls.map(([title, body]) => <article key={title}><i className="fas fa-shield-halved" /><h2>{title}</h2><p>{body}</p></article>)}</div>
      <section className="aisle-trust-limit"><h2>Transparent prototype limitations</h2><p>The default tokenized-card experience is simulated and no money moves; COD is not collected. Catalog, offers, ratings, orders and analytics can be synthetic demo data. Forecasts are directional decision support. Availability must be verified by the merchant. AI output can be wrong and should be reviewed.</p></section>
      <div className="d-flex gap-2 flex-wrap"><Link className="btn btn-secondary" href="/cart-pilot">Try the Gemini concierge</Link><Link className="btn btn-outline-secondary" href="/evidence">Inspect evidence & architecture</Link></div>
    </div>
  </main><Footer /></div>;
}
