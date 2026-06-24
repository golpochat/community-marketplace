import { WebAdminDashboardShell } from '@/components/layout/web-admin-dashboard-shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <WebAdminDashboardShell>{children}</WebAdminDashboardShell>;
}
