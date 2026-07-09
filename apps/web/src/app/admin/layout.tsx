import type { Metadata } from 'next';

import { NOINDEX_ROBOTS } from '@/lib/seo/constants';

import { AdminLayoutShell } from './admin-layout-shell';

export const metadata: Metadata = {
  robots: NOINDEX_ROBOTS,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
