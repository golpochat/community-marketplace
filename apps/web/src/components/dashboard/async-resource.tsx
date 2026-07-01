'use client';

import { Card, PageHeader } from '@community-marketplace/ui-dashboard';

import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { LoadingState } from '@/components/LoadingState';

interface DashboardPageShellProps {
  title: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  children: React.ReactNode;
}

export function DashboardPageShell({
  title,
  description,
  loading,
  error,
  empty,
  emptyTitle = 'No data yet',
  emptyDescription,
  children,
}: DashboardPageShellProps) {
  return (
    <>
      <PageHeader title={title} description={description} />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && empty && (
        <Card>
          <EmptyState variant="dashboard" title={emptyTitle} description={emptyDescription} />
        </Card>
      )}
      {!loading && !error && !empty && children}
    </>
  );
}

interface KeyValueListProps {
  items: Array<{ label: string; value: React.ReactNode }>;
}

export function KeyValueList({ items }: KeyValueListProps) {
  return (
    <dl className="divide-y divide-[hsl(var(--dashboard-sidebar-border))]">
      {items.map((item) => (
        <div key={item.label} className="flex justify-between gap-4 py-3 text-sm">
          <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">{item.label}</dt>
          <dd className="text-right font-medium text-[hsl(var(--dashboard-main-fg))]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

interface DataTableProps {
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
}

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[hsl(var(--dashboard-sidebar-border))]">
      <table className="min-w-full divide-y divide-[hsl(var(--dashboard-sidebar-border))] text-sm">
        <thead className="bg-[hsl(var(--dashboard-sidebar-active)/0.35)]">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[hsl(var(--dashboard-sidebar-border))] bg-card">
          {rows.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 text-[hsl(var(--dashboard-main-fg))]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
