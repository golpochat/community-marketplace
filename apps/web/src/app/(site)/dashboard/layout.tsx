import type { Metadata } from 'next';

import { NOINDEX_ROBOTS } from '@/lib/seo/constants';

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default function LegacyDashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
