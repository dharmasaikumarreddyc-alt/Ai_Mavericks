import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CopilotLabClient from './CopilotLabClient';

export const metadata: Metadata = {
  title: 'Live Retail Copilot Lab | Aisle AI',
  description: 'Run a governed Gemini multimodal retail journey with grounded products, visible controls, stockout rescue, and human approval.',
};

export default function CopilotLabPage() {
  return (
    <div className="page-wraper">
      <Header />
      <main className="copilot-lab">
        <CopilotLabClient />
      </main>
      <Footer />
    </div>
  );
}
