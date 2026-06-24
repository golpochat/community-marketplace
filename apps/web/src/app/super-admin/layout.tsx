import { WebSuperAdminDashboardShell } from '@/components/layout/web-super-admin-dashboard-shell';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <WebSuperAdminDashboardShell>{children}</WebSuperAdminDashboardShell>;
}
