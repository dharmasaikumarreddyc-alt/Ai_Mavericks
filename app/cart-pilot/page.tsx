import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CartPilotClient from './CartPilotClient';
import CopilotLabClient from '../copilot-lab/CopilotLabClient';

export const metadata: Metadata = {
  title: 'Gemini AI Concierge | Loopora',
  description: 'Use voice, text, and optional image context with Gemini-assisted discovery and deterministic commerce controls.',
};

export default function CartPilotPage() {
  return (
    <div className="page-wraper">
      <Header />

      <div className="page-content bg-light" style={{ paddingTop: '0', minHeight: '100vh' }}>
        <CartPilotClient />

        <section id="visual-copilot" aria-label="Visual Gemini shopping copilot">
          <CopilotLabClient />
        </section>
      </div>

      <Footer />
    </div>
  );
}
