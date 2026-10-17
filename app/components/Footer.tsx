import Link from 'next/link';

export default function Footer() {
  return <footer className="aisle-footer">
    <div className="container aisle-footer-grid">
      <div><Link className="aisle-footer-brand" href="/"><img src="/images/logo.svg" alt="" /> Aisle AI</Link><p>The closed-loop commerce copilot, powered by Gemini and designed with people in control.</p></div>
      <nav aria-label="Customer"><strong>Customer</strong><Link href="/shop">Marketplace</Link><Link href="/cart-pilot">AI Concierge</Link><Link href="/account/orders">My orders</Link></nav>
      <nav aria-label="Business"><strong>Business</strong><Link href="/merchant/login">Merchant portal</Link><Link href="/trust">Trust & governance</Link></nav>
      <div><strong>Prototype disclosure</strong><p>Card tokenization is simulated and moves no money; COD is not collected. Catalog data is synthetic. Verify AI recommendations.</p></div>
    </div>
    <div className="container aisle-footer-bottom"><span>© 2026 Aisle AI</span><span>Built for Google AI Builder Cup · Retail & Commerce</span></div>
  </footer>;
}
