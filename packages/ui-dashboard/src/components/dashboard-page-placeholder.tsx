export interface DashboardPagePlaceholderProps {
  title: string;
  description?: string;
}

export function DashboardPagePlaceholder({ title, description }: DashboardPagePlaceholderProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {description ? <p className="mt-1 text-sm opacity-70">{description}</p> : null}
      <div className="mt-8 rounded-xl border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-topbar-bg)/0.5)] p-8 text-center text-sm opacity-60">
        This section is ready for feature integration.
      </div>
    </div>
  );
}
