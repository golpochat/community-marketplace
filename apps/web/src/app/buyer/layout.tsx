import type { Metadata } from 'next';

import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { NOINDEX_ROBOTS } from '@/lib/seo/constants';

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout role="BUYER" theme="buyer">
      {children}
    </DashboardLayout>
  );
}
