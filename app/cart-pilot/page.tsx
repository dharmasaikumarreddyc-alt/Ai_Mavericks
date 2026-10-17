import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CartPilotClient from './CartPilotClient';

export const metadata: Metadata = {
  title: 'Gemini AI Concierge',
  description: 'Use Gemini-assisted discovery and deterministic commerce tools, then explicitly confirm a prototype order.',
};

export default function CartPilotPage() {
  return (
    <div className="page-wraper">
      <Header />

      <div className="page-content bg-light" style={{ paddingTop: '0', minHeight: '100vh' }}>
        <CartPilotClient />
      </div>

      <Footer />
    </div>
  );
}
