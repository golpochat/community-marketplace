import { cn } from '@community-marketplace/ui';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'dashboard';
}

export function EmptyState({ title, description, action, className, variant = 'default' }: EmptyStateProps) {
  const isDashboard = variant === 'dashboard';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center',
        isDashboard
          ? 'border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.35)]'
          : 'border-gray-200 bg-gray-50',
        className,
      )}
    >
      <div
        className={cn(
          'mb-4 flex h-16 w-16 items-center justify-center rounded-full text-2xl',
          isDashboard
            ? 'bg-[hsl(var(--dashboard-sidebar-active))] text-[hsl(var(--dashboard-sidebar-muted))]'
            : 'bg-gray-200 text-gray-700',
        )}
      >
        ∅
      </div>
      <h3
        className={cn(
          'text-lg font-semibold',
          isDashboard ? 'text-[hsl(var(--dashboard-main-fg))]' : 'text-gray-900',
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            'mt-2 max-w-sm text-sm',
            isDashboard ? 'text-[hsl(var(--dashboard-sidebar-muted))]' : 'text-gray-700',
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
