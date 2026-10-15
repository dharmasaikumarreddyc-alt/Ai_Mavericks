import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Preloader from '../components/Preloader';
import Link from 'next/link';
import CheckoutClient from './CheckoutClient';

export const metadata: Metadata = {
  title: 'Agentic AI Checkout | Checkout',
  description: 'Complete your order checkout',
};

export default function CheckoutPage() {
  return (
    <div className="page-wraper">
      <Preloader />

      <Header />

      <div className="page-content bg-light">
        {/* Banner Start */}
        <div className="dz-bnr-inr bg-secondary overlay-black-light" style={{backgroundImage: 'url(/images/background/bg1.jpg)'}}>
          <div className="container">
            <div className="dz-bnr-inr-entry">
              <h1>Shop Checkout</h1>
              <nav aria-label="breadcrumb" className="breadcrumb-row">
                <ul className="breadcrumb">
                  <li className="breadcrumb-item"><Link href="/"> Home</Link></li>
                  <li className="breadcrumb-item">Shop Checkout</li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
        {/* Banner End */}

        {/* Dynamic checkout content */}
        <CheckoutClient />
      </div>

      <Footer />

      <button className="scroltop" type="button">
        <i className="fas fa-arrow-up"></i>
      </button>
    </div>
  );
}
