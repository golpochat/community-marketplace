import { WebSellerDashboardShell } from '@/components/layout/web-seller-dashboard-shell';

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <WebSellerDashboardShell>{children}</WebSellerDashboardShell>;
}
