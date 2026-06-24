import { RoleDashboardShell } from '@/components/layout/role-dashboard-shell';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleDashboardShell role="SUPER_ADMIN">{children}</RoleDashboardShell>;
}
