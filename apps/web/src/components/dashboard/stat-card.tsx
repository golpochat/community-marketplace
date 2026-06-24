import { DashboardCard } from '@community-marketplace/ui-dashboard';

interface StatCardProps {
  label: string;
  value: string;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <DashboardCard>
      <p className="text-sm font-medium text-[hsl(var(--dashboard-sidebar-muted))]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[hsl(var(--dashboard-main-fg))]">{value}</p>
    </DashboardCard>
  );
}
