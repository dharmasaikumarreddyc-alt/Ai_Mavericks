import type { Metadata } from 'next';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Preloader from '../components/Preloader';
import CartClient from './CartClient';

export const metadata: Metadata = {
  title: 'Cart',
  description: 'Review your Loopora cart before checkout.',
};

export default function CartPage() {
  return (
    <>
      <Preloader />
      <div className="page-wraper">
        <Header />

        <div className="page-content bg-light">
          {/* Banner Start */}
          <div className="dz-bnr-inr bg-secondary overlay-black-light" style={{backgroundImage: 'url(/images/background/bg1.jpg)'}}>
            <div className="container">
              <div className="dz-bnr-inr-entry">
                <h1>Shop Cart</h1>
                <nav aria-label="breadcrumb" className="breadcrumb-row">
                  <ul className="breadcrumb">
                    <li className="breadcrumb-item"><Link href="/"> Home</Link></li>
                    <li className="breadcrumb-item">Shop Cart</li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
          {/* Banner End */}

          {/* Contact Area */}
          <section className="content-inner shop-account">
            {/* Product */}
            <div className="container">
              <CartClient />
            </div>
            {/* Product END */}
          </section>
          {/* Contact Area End */}
        </div>

        <Footer />

        <button className="scroltop" type="button"><i className="fas fa-arrow-up"></i></button>
      </div>
    </>
  );
}
