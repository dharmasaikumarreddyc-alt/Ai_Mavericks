import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Preloader from '../components/Preloader';
import LegacyPageBanner from '../components/LegacyPageBanner';
import CopilotLabClient from './CopilotLabClient';

export const metadata: Metadata = {
  title: 'Live Retail Copilot Lab | Loopora',
  description: 'Run a governed Gemini multimodal retail journey with grounded products, visible controls, stockout rescue, and human approval.',
};

export default function CopilotLabPage() {
  return (
    <div className="page-wraper">
      <Preloader />
      <Header />
      <div className="page-content bg-light legacy-ai-surface">
        <LegacyPageBanner title="Live Retail Copilot" current="Live Copilot Lab" parentHref="/cart-pilot" parentLabel="AI Shopping" />
        <main className="copilot-lab legacy-modern-page">
          <CopilotLabClient />
        </main>
      </div>
      <Footer />
      <button className="scroltop" type="button" aria-label="Back to top"><i className="fas fa-arrow-up"></i></button>
    </div>
  );
}
