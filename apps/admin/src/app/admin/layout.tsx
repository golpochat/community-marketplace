import { RoleDashboardShell } from '@/components/layout/role-dashboard-shell';

export default function AdminRoleLayout({ children }: { children: React.ReactNode }) {
  return <RoleDashboardShell role="ADMIN">{children}</RoleDashboardShell>;
}
