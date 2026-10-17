import type { Metadata } from 'next';
import MerchantDashboardClient from './MerchantDashboardClient';

export const metadata: Metadata = {
  title: 'Store Analytics | Merchant Dashboard',
  description: 'Application-backed demo analytics, order insights, cancellation analysis, stock signals, and revenue breakdown.',
};

export default async function MerchantDashboardPage({ params }: { params: Promise<{ merchantId: string }> }) {
  const { merchantId } = await params;
  return <MerchantDashboardClient merchantId={merchantId} />;
}
