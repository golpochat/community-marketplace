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
      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-[13px] font-medium text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-50"
      aria-label={`Remove filter ${chip.label}`}
    >
      {chip.label}
      <X className="h-3.5 w-3.5 text-gray-400" aria-hidden />
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
        'flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2',
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
