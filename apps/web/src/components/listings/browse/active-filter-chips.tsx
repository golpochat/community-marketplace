'use client';

import type { Category, ListingSearchFilters } from '@community-marketplace/types';
import { cn } from '@community-marketplace/ui';
import { X } from 'lucide-react';

import {
  buildActiveFilterChips,
  hasActiveFilters,
  resetBrowseFilters,
  type ActiveFilterChip,
} from '@/components/listings/browse/browse-filter-constants';

interface ActiveFilterChipsProps {
  filters: ListingSearchFilters;
  categories: Category[];
  onChange: (filters: ListingSearchFilters) => void;
  className?: string;
}

function Chip({ chip }: { chip: ActiveFilterChip }) {
  return (
    <button
      type="button"
      onClick={chip.onRemove}
      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[13px] font-medium text-foreground transition-colors duration-150 hover:border-border hover:bg-muted"
      aria-label={`Remove filter ${chip.label}`}
    >
      {chip.label}
      <X className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
    </button>
  );
}

export function ActiveFilterChips({
  filters,
  categories,
  onChange,
  className,
}: ActiveFilterChipsProps) {
  const chips = buildActiveFilterChips(filters, categories, onChange);

  if (!hasActiveFilters(filters)) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2',
        className,
      )}
      aria-label="Active filters"
    >
      {chips.map((chip) => (
        <Chip key={`${chip.id}-${chip.label}`} chip={chip} />
      ))}
      <button
        type="button"
        onClick={() => onChange(resetBrowseFilters(filters.limit))}
        className="ml-auto text-[13px] font-medium text-primary hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
