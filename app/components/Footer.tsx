'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer bg-light legacy-loopora-footer">
      <div className="footer-top">
        <div className="container">
          <div className="row">
            <div className="col-xl-4 col-md-6 col-sm-12 wow fadeInUp" data-wow-delay="0.1s">
              <div className="widget widget_about me-2">
                <div className="footer-logo logo-dark">
                  <Link href="/"><img src="/images/logo.svg" alt="Loopora" /></Link>
                </div>
                <p className="legacy-footer-copy">
                  Smart shopping with voice, text and visual context—grounded in the marketplace and confirmed by you.
                </p>
                <ul className="widget-address legacy-footer-boundaries">
                  <li><p><span>Discover</span> : local products and merchants</p></li>
                  <li><p><span>Plan</span> : budget-aware AI shopping assistance</p></li>
                  <li><p><span>Confirm</span> : you stay in control before checkout</p></li>
                </ul>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 col-sm-6 wow fadeInUp" data-wow-delay="0.2s">
              <div className="widget widget_post">
                <h5 className="footer-title">AI Shopping</h5>
                <ul>
                  <li>
                    <div className="dz-media"><img src="/images/shop/product/small/1.png" alt="Voice shopping" /></div>
                    <div className="dz-content">
                      <h6 className="name"><Link href="/cart-pilot">CartPilot Concierge</Link></h6>
                      <span className="time">Talk, type, review and confirm</span>
                    </div>
                  </li>
                  <li>
                    <div className="dz-media"><img src="/images/shop/product/small/2.png" alt="Visual shopping" /></div>
                    <div className="dz-content">
                      <h6 className="name"><Link href="/cart-pilot#visual-copilot">Visual CartPilot</Link></h6>
                      <span className="time">Add a product, pantry or meal image</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <div className="col-xl-2 col-md-4 col-sm-6 wow fadeInUp" data-wow-delay="0.3s">
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

            <div className="col-xl-3 col-md-8 col-sm-6 wow fadeInUp" data-wow-delay="0.4s">
              <div className="widget widget_services">
                <h5 className="footer-title">Account &amp; Business</h5>
                <ul>
                  <li><Link href="/login">Customer sign in</Link></li>
                  <li><Link href="/register">Create account</Link></li>
                  <li><Link href="/account/orders">Your orders</Link></li>
                  <li><Link href="/merchant/login">Merchant sign in</Link></li>
                  <li><Link href="/merchant/dashboard">Merchant dashboard</Link></li>
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
              <p className="copyright-text">© <span className="current-year">2026</span> AI Mavericks · Loopora.</p>
            </div>
            <div className="col-lg-5 col-md-12 text-lg-end text-start">
              <p className="mb-0">Discover smarter · shop faster · stay in control.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
