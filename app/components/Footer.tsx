'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer bg-light legacy-loopora-footer">
      <div className="footer-top">
        <div className="container">
          <div className="row">
            <div className="col-xl-3 col-md-4 col-sm-6 wow fadeInUp" data-wow-delay="0.1s">
              <div className="widget widget_about me-2">
                <div className="footer-logo logo-dark">
                  <Link href="/"><img src="/images/logo.svg" alt="Loopora" /></Link>
                </div>
                <p className="legacy-footer-copy">
                  A governed closed-loop commerce copilot: Gemini understands intent, deterministic systems verify commerce facts, and people approve consequential actions.
                </p>
                <ul className="widget-address legacy-footer-boundaries">
                  <li><p><span>AI</span> : Gemini-assisted discovery and explanation</p></li>
                  <li><p><span>Control</span> : deterministic price, stock, budget and policy checks</p></li>
                  <li><p><span>Authority</span> : customer and merchant approval before action</p></li>
                </ul>
              </div>
            </div>

            <div className="col-xl-3 col-md-4 col-sm-6 wow fadeInUp" data-wow-delay="0.2s">
              <div className="widget widget_post">
                <h5 className="footer-title">AI Experiences</h5>
                <ul>
                  <li>
                    <div className="dz-media"><img src="/images/shop/product/small/1.png" alt="Voice shopping" /></div>
                    <div className="dz-content">
                      <h6 className="name"><Link href="/cart-pilot">Voice AI Concierge</Link></h6>
                      <span className="time">Talk, review and confirm</span>
                    </div>
                  </li>
                  <li>
                    <div className="dz-media"><img src="/images/shop/product/small/2.png" alt="Live copilot" /></div>
                    <div className="dz-content">
                      <h6 className="name"><Link href="/copilot-lab">Live Copilot Lab</Link></h6>
                      <span className="time">Multimodal + visible controls</span>
                    </div>
                  </li>
                  <li>
                    <div className="dz-media"><img src="/images/shop/product/small/3.png" alt="Evidence" /></div>
                    <div className="dz-content">
                      <h6 className="name"><Link href="/evidence">Evidence &amp; Architecture</Link></h6>
                      <span className="time">Inspect how decisions are governed</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-xl-2 col-md-4 col-sm-4 col-6 wow fadeInUp" data-wow-delay="0.3s">
              <div className="widget widget_services">
                <h5 className="footer-title">Marketplace</h5>
                <ul>
                  <li><Link href="/shop">Browse products</Link></li>
                  <li><Link href="/shop?search=breakfast">Breakfast</Link></li>
                  <li><Link href="/shop?search=coffee">Coffee &amp; Drinks</Link></li>
                  <li><Link href="/cart">Shopping cart</Link></li>
                  <li><Link href="/checkout">Checkout</Link></li>
                </ul>
              </div>
            </div>

            <div className="col-xl-2 col-md-4 col-sm-4 col-6 wow fadeInUp" data-wow-delay="0.4s">
              <div className="widget widget_services">
                <h5 className="footer-title">Your Account</h5>
                <ul>
                  <li><Link href="/login">Customer sign in</Link></li>
                  <li><Link href="/account/dashboard">Account dashboard</Link></li>
                  <li><Link href="/account/orders">Orders</Link></li>
                  <li><Link href="/account/address">Addresses</Link></li>
                  <li><Link href="/account/payment-methods">Payment safety</Link></li>
                </ul>
              </div>
            </div>

            <div className="col-xl-2 col-md-4 col-sm-4 col-12 wow fadeInUp" data-wow-delay="0.5s">
              <div className="widget widget_services">
                <h5 className="footer-title">Business &amp; Trust</h5>
                <ul>
                  <li><Link href="/merchant/login">Merchant sign in</Link></li>
                  <li><Link href="/merchant/dashboard">Merchant dashboard</Link></li>
                  <li><Link href="/trust">Trust &amp; governance</Link></li>
                  <li><Link href="/evidence">Verified evidence</Link></li>
                  <li><Link href="/copilot-lab">Failure-mode demo</Link></li>
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
              <p className="copyright-text">© <span className="current-year">2026</span> AI Mavericks · Loopora prototype for Google AI Builder Cup.</p>
            </div>
            <div className="col-lg-5 col-md-12 text-lg-end text-start">
              <p className="mb-0">Gemini proposes · deterministic systems validate · humans approve.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
