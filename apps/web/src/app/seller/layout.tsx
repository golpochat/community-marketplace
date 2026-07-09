import type { Metadata } from 'next';

import { NOINDEX_ROBOTS } from '@/lib/seo/constants';

import { SellerLayoutShell } from './seller-layout-shell';

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <SellerLayoutShell>{children}</SellerLayoutShell>;
}
