'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';

import { Button } from '@community-marketplace/ui';
import type { Category, ListingSearchFilters } from '@community-marketplace/types';
import { RotateCcw, SlidersHorizontal, X } from 'lucide-react';

import { BrowseFilterSidebar } from '@/components/listings/browse/browse-filter-sidebar';
import { resetBrowseFilters } from '@/components/listings/browse/browse-filter-constants';

interface BrowseMobileFilterDrawerProps {
  categories: Category[];
  filters: ListingSearchFilters;
  onChange: (filters: ListingSearchFilters) => void;
}

export function BrowseMobileFilterDrawer({
  categories,
  filters,
  onChange,
}: BrowseMobileFilterDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full justify-center gap-2 text-sm font-medium lg:hidden"
        onClick={() => setOpen(true)}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        Filters
      </Button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden">
              <div className="flex items-center justify-between border-b border-border px-4 py-4">
                <h2 className="text-base font-semibold text-foreground">Filters</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-muted-foreground transition-colors duration-150 hover:bg-muted"
                  aria-label="Close filters"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <BrowseFilterSidebar
                  categories={categories}
                  filters={filters}
                  onChange={onChange}
                />
              </div>

              <div className="flex gap-3 border-t border-border p-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-1.5"
                  onClick={() => onChange(resetBrowseFilters(filters.limit))}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Clear all
                </Button>
                <Button type="button" className="flex-1" onClick={() => setOpen(false)}>
                  Done
                </Button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
