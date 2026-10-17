import type { Metadata } from 'next';
import MerchantSelectorClient from './dashboard/MerchantSelectorClient';

export const metadata: Metadata = {
  title: 'Merchant Workspace',
  description: 'Authenticated restaurant sales analytics, cancellations, and review insights.',
};

export default function MerchantPage() {
  return <MerchantSelectorClient />;
}
