'use client';

import { cn } from '@community-marketplace/ui';
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
  /** When false, hides horizontal scroll (use when columns fit the layout). */
  scrollable?: boolean;
  /** Per-column widths, e.g. `['20%', '40%', '80px']`. */
  columnWidths?: string[];
  /** Optional per-column cell classes (applied to header and body cells). */
  columnClassNames?: string[];
}

export function DataTable({
  columns,
  rows,
  scrollable = true,
  columnWidths,
  columnClassNames,
}: DataTableProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-[hsl(var(--dashboard-sidebar-border))]',
        scrollable ? 'overflow-x-auto' : 'overflow-x-hidden',
      )}
    >
      <table className="w-full table-fixed divide-y divide-[hsl(var(--dashboard-sidebar-border))] text-sm">
        {columnWidths && columnWidths.length > 0 ? (
          <colgroup>
            {columnWidths.map((width, index) => (
              <col key={`${width}-${index}`} style={{ width }} />
            ))}
          </colgroup>
        ) : null}
        <thead className="bg-[hsl(var(--dashboard-sidebar-active)/0.35)]">
          <tr>
            {columns.map((col, index) => (
              <th
                key={col}
                className={cn(
                  'overflow-hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]',
                  columnClassNames?.[index],
                )}
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
                <td
                  key={cellIndex}
                  className={cn(
                    'overflow-hidden px-4 py-3 text-[hsl(var(--dashboard-main-fg))]',
                    columnClassNames?.[cellIndex],
                  )}
                >
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
