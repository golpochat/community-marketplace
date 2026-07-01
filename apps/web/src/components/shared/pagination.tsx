'use client';

import { Button } from '@community-marketplace/ui';
import { cn } from '@community-marketplace/ui';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  total?: number;
  limit?: number;
  showSummary?: boolean;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  className,
  showSummary = true,
}: PaginationProps) {
  if (totalPages <= 1 && (total ?? 0) === 0 && !showSummary) return null;

  const resolvedTotal = total ?? 0;
  const resolvedLimit = limit ?? 1;
  const start = resolvedTotal === 0 ? 0 : (page - 1) * resolvedLimit + 1;
  const end = Math.min(page * resolvedLimit, resolvedTotal);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <div className={cn('space-y-4', className)}>
      {showSummary && total != null && limit != null && (
        <p className="text-center text-sm text-muted-foreground">
          {resolvedTotal === 0
            ? 'No results'
            : `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${resolvedTotal.toLocaleString()} results`}
        </p>
      )}

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          {pages.map((p, idx) => {
            const prev = pages[idx - 1];
            const showEllipsis = prev != null && p - prev > 1;
            return (
              <span key={p} className="flex items-center gap-1">
                {showEllipsis && <span className="px-2 text-muted-foreground/70">…</span>}
                <Button
                  variant={p === page ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(p)}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </Button>
              </span>
            );
          })}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  );
}
