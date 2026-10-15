import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import MerchantConsoleClient from './MerchantConsoleClient';

export const metadata: Metadata = {
  title: 'Merchant Console | Agentic AI Checkout',
  description: 'Live incoming orders for merchants — accept, prepare, and mark orders ready.',
};

export default function MerchantPage() {
  return (
    <div className="page-wraper">
      <Header />
      <div className="page-content bg-light" style={{ paddingTop: '0', minHeight: '100vh' }}>
        <MerchantConsoleClient />
      </div>
      <Footer />
    </div>
  );
}
