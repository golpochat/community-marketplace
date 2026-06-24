import { WebBuyerDashboardShell } from '@/components/layout/web-buyer-dashboard-shell';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  return <WebBuyerDashboardShell>{children}</WebBuyerDashboardShell>;
}
