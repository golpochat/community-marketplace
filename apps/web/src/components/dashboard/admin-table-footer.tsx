'use client';

import { Pagination } from '@/components/shared/pagination';

interface AdminTableFooterProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function AdminTableFooter({ page, totalPages, total, onPageChange }: AdminTableFooterProps) {
  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
        {total} total record{total === 1 ? '' : 's'}
      </p>
      <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}
