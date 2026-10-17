import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProductList from '../components/ProductList';

export const metadata: Metadata = {
  title: 'Local Marketplace',
  description: 'Search grounded local food and drink catalogs, or ask Gemini to prepare the right cart.',
};

export default function Shop() {
  return <div className="page-wraper">
    <Header />
    <main className="page-content bg-light">
      <section className="aisle-shop-hero">
        <div className="container">
          <div>
            <p>GROUNDED PRODUCT DISCOVERY</p>
            <h1>Find exactly what you need.</h1>
            <span>Search a clearly synthetic catalog—then let Gemini help compare and compose a cart.</span>
          </div>
          <Link href="/cart-pilot" className="btn btn-primary">Ask AI Concierge <i className="fas fa-arrow-right" /></Link>
        </div>
      </section>
      <section className="content-inner-3">
        <div className="container"><Suspense fallback={<div className="aisle-route-loading">Loading catalog…</div>}><ProductList /></Suspense></div>
      </section>
    </main>
    <Footer />
  </div>;
}
