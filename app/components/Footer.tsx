'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer bg-light">
      <div className="footer-top">
        <div className="container">
          <div className="row">
            <div className="col-xl-4 col-md-6 col-sm-12 wow fadeInUp" data-wow-delay="0.1s">
              <div className="widget widget_about me-2">
                <div className="footer-logo logo-dark">
                  <Link href="/"><img src="/images/logo.svg" alt="Loopora" /></Link>
                </div>
                <p className="mb-3">
                  A governed closed-loop commerce prototype: Gemini interprets intent, deterministic systems verify commerce facts, and people approve consequential actions.
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <Link href="/copilot-lab" className="btn btn-secondary btn-sm">Live Copilot</Link>
                  <Link href="/shop" className="btn btn-outline-secondary btn-sm">Marketplace</Link>
                </div>
              </div>
            </div>

            <div className="col-xl-2 col-md-3 col-sm-4 col-6 wow fadeInUp" data-wow-delay="0.2s">
              <div className="widget widget_services">
                <h5 className="footer-title">Customer</h5>
                <ul>
                  <li><Link href="/shop">Browse marketplace</Link></li>
                  <li><Link href="/cart-pilot">AI concierge</Link></li>
                  <li><Link href="/cart">Cart</Link></li>
                  <li><Link href="/account/orders">Orders</Link></li>
                </ul>
              </div>
            </div>

            <div className="col-xl-2 col-md-3 col-sm-4 col-6 wow fadeInUp" data-wow-delay="0.3s">
              <div className="widget widget_services">
                <h5 className="footer-title">Merchant</h5>
                <ul>
                  <li><Link href="/merchant/login">Merchant sign in</Link></li>
                  <li><Link href="/merchant/dashboard">Dashboard</Link></li>
                  <li><Link href="/evidence">Evidence lab</Link></li>
                  <li><Link href="/trust">Trust center</Link></li>
                </ul>
              </div>
            </div>

            <div className="col-xl-4 col-md-6 col-sm-12 wow fadeInUp" data-wow-delay="0.4s">
              <div className="widget widget_services">
                <h5 className="footer-title">Prototype boundaries</h5>
                <ul>
                  <li>Catalog, inventory, merchant history and forecasts are synthetic or directional.</li>
                  <li>Default card checkout uses simulated tokenization; no card number is collected and no money moves.</li>
                  <li>Gemini proposes. Deterministic systems validate. Humans approve.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <div className="row fb-inner wow fadeInUp" data-wow-delay="0.1s">
            <div className="col-lg-7 col-md-12 text-start">
              <p className="copyright-text">© <span className="current-year">2026</span> AI Mavericks · Google AI Builder Cup prototype.</p>
            </div>
            <div className="col-lg-5 col-md-12 text-lg-end text-start">
              <p className="mb-0"><Link href="/trust">Responsible AI &amp; limitations</Link></p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
