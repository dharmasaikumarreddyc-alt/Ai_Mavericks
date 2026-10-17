import type { Metadata } from 'next';
import Link from 'next/link';
import Header from './components/Header';
import Footer from './components/Footer';
import PopularProducts from './components/PopularProducts';

export const metadata: Metadata = {
  title: 'Aisle AI — Closed-Loop Commerce Copilot',
  description: 'A Gemini-assisted commerce prototype for grounded discovery, customer-confirmed ordering, and merchant operations.',
};

const loop = [
  ['01', 'Understand', 'Interpret a natural-language shopping goal and its constraints.'],
  ['02', 'Ground', 'Resolve every merchant, item, price, and availability claim to the bounded catalog.'],
  ['03', 'Confirm', 'Show the proposed basket, provenance, full total, and payment status before ordering.'],
  ['04', 'Fulfil', 'Persist the order and expose controlled status transitions to the authenticated merchant.'],
  ['05', 'Learn', 'Turn historical orders and feedback into directional, human-approved recommendations.'],
];

export default function Home() {
  return (
    <div className="page-wraper">
      <Header />
      <main className="aisle-home">
        <section className="aisle-home-hero">
          <div className="container aisle-home-hero-grid">
            <div>
              <p className="aisle-home-kicker"><span /> GEMINI-ASSISTED · HUMAN-CONFIRMED</p>
              <h1>One intelligent loop from customer intent to merchant action.</h1>
              <p className="aisle-home-lede">
                Aisle AI grounds conversational product discovery in a real application catalog,
                prepares a transparent basket, persists the confirmed order, and helps merchants
                act on demand and feedback evidence.
              </p>
              <div className="aisle-home-actions">
                <Link className="btn btn-secondary" href="/cart-pilot">Try the AI concierge <i className="fas fa-arrow-right" /></Link>
                <Link className="btn btn-outline-secondary" href="/shop">Search the catalog</Link>
                <Link className="btn btn-outline-secondary" href="/evidence">Inspect the evidence</Link>
              </div>
              <div className="aisle-home-disclosures">
                <span><i className="fas fa-database" /> Synthetic demo catalog</span>
                <span><i className="fas fa-user-check" /> Explicit confirmation</span>
                <span><i className="fas fa-shield-halved" /> Guarded model boundary</span>
              </div>
            </div>

            <aside className="aisle-home-proof" aria-label="Aisle AI workflow preview">
              <div className="aisle-home-proof-head"><span><i className="fas fa-wand-magic-sparkles" /> Grounded cart trace</span><b>DEMO</b></div>
              <p className="aisle-home-query">“Vegan breakfast and an oat milk coffee under $20.”</p>
              <div className="aisle-home-match">
                <i className="fas fa-check" />
                <div><strong>2 catalog-backed matches</strong><small>IDs and prices resolved before display</small></div>
              </div>
              <div className="aisle-home-proof-row"><span>Model path</span><strong>Gemini or labelled fallback</strong></div>
              <div className="aisle-home-proof-row"><span>Pricing</span><strong>Application recomputes total</strong></div>
              <div className="aisle-home-proof-row"><span>Checkout</span><strong>Customer confirmation required</strong></div>
              <div className="aisle-home-proof-note">Demo tokenization moves no money. COD remains uncollected.</div>
            </aside>
          </div>
        </section>

        <section className="aisle-home-loop container" aria-labelledby="closed-loop-title">
          <div className="aisle-home-section-head">
            <div><p>THE DIFFERENTIATOR</p><h2 id="closed-loop-title">Closed-loop commerce, not another chatbot.</h2></div>
            <Link href="/evidence">Inspect workflow ownership <i className="fas fa-arrow-right" /></Link>
          </div>
          <div className="aisle-home-loop-grid">
            {loop.map(([number, title, description]) => (
              <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>
            ))}
          </div>
        </section>

        <section className="aisle-home-products">
          <div className="container">
            <div className="aisle-home-section-head">
              <div><p>GROUNDING EVIDENCE</p><h2>Explore the synthetic catalog.</h2></div>
              <Link href="/shop">Search all products <i className="fas fa-arrow-right" /></Link>
            </div>
            <PopularProducts />
          </div>
        </section>

        <section className="aisle-home-merchant">
          <div className="container aisle-home-merchant-grid">
            <div>
              <p>MERCHANT OPERATIONS</p>
              <h2>The order does not disappear after checkout.</h2>
              <span>Authenticated merchants receive persistent orders, controlled fulfilment states, historical demand signals, review themes, and an auditable queue of recommendations accepted for staff review.</span>
            </div>
            <Link className="btn btn-light" href="/merchant/login">Open merchant workspace <i className="fas fa-arrow-right" /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
