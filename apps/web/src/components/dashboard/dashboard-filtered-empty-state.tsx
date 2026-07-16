'use client';

import type { ReactNode } from 'react';

import { cn } from '@community-marketplace/ui';

import { EmptyState } from '@/components/EmptyState';

export const dashboardClearFiltersButtonClass =
  'rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-1.5 text-sm font-medium text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)]';

interface DashboardClearFiltersButtonProps {
  onClick: () => void;
  className?: string;
  label?: string;
}

export function DashboardClearFiltersButton({
  onClick,
  className,
  label = 'Clear filters',
}: DashboardClearFiltersButtonProps) {
  return (
    <button type="button" onClick={onClick} className={cn(dashboardClearFiltersButtonClass, className)}>
      {label}
    </button>
  );
}

interface DashboardFilteredEmptyStateProps {
  title: string;
  description?: string;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  action?: ReactNode;
}

export function DashboardFilteredEmptyState({
  title,
  description,
  hasActiveFilters = false,
  onClearFilters,
  action,
}: DashboardFilteredEmptyStateProps) {
  const resolvedDescription =
    description ??
    (hasActiveFilters ? 'Try adjusting your filters or search terms.' : undefined);

  const showClear = hasActiveFilters && onClearFilters;
  const showActions = showClear || action;

  return (
    <EmptyState
      variant="dashboard"
      title={title}
      description={resolvedDescription}
      action={
        showActions ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            {showClear ? <DashboardClearFiltersButton onClick={onClearFilters} /> : null}
            {action}
          </div>
        ) : undefined
      }
    />
  );
}

interface DashboardTableBodyProps {
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  emptyAction?: ReactNode;
  children: ReactNode;
}

/** Renders an inline empty state or table content while keeping filters visible above. */
export function DashboardTableBody({
  isEmpty,
  emptyTitle,
  emptyDescription,
  hasActiveFilters,
  onClearFilters,
  emptyAction,
  children,
}: DashboardTableBodyProps) {
  if (isEmpty) {
    return (
      <DashboardFilteredEmptyState
        title={emptyTitle}
        description={emptyDescription}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={onClearFilters}
        action={emptyAction}
      />
    );
  }

  return <>{children}</>;
}
