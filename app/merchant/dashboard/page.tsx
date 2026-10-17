import type { Metadata } from 'next';
import MerchantSelectorClient from './MerchantSelectorClient';

export const metadata: Metadata = {
  title: 'Select Your Store | Merchant Dashboard',
  description: 'Open the authenticated merchant workspace for demo analytics, order insights, and revenue data.',
};

export default function MerchantDashboardSelectorPage() {
  return <MerchantSelectorClient />;
}
