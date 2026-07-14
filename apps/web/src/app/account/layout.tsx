import type { Metadata } from 'next';

import { AccountDashboardLayout } from '@/components/account/account-dashboard-layout';
import { NOINDEX_ROBOTS } from '@/lib/seo/constants';

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <AccountDashboardLayout>{children}</AccountDashboardLayout>;
}
