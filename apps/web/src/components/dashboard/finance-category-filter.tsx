'use client';

import { useEffect, useRef, useState } from 'react';

export type FinanceRecordCategory =
  | 'buyer'
  | 'seller'
  | 'platform_service'
  | 'marketplace_fee';

export const FINANCE_RECORD_CATEGORIES: FinanceRecordCategory[] = [
  'buyer',
  'seller',
  'platform_service',
  'marketplace_fee',
];

export const DEFAULT_REVENUE_CATEGORIES: FinanceRecordCategory[] = [
  'platform_service',
  'marketplace_fee',
];

export const FINANCE_CATEGORY_LABELS: Record<FinanceRecordCategory, string> = {
  buyer: 'Buyer',
  seller: 'Seller',
  platform_service: 'Platform service',
  marketplace_fee: 'Marketplace fee',
};

interface FinanceCategoryFilterProps {
  value: FinanceRecordCategory[];
  onChange: (categories: FinanceRecordCategory[]) => void;
}

function normalizeSelection(categories: FinanceRecordCategory[]): FinanceRecordCategory[] {
  if (!categories.includes('seller')) {
    return categories.filter((category) => category !== 'marketplace_fee');
  }
  return categories;
}

function arraysEqual(a: FinanceRecordCategory[], b: FinanceRecordCategory[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item) => b.includes(item));
}

function selectionLabel(categories: FinanceRecordCategory[]): string {
  const selected = normalizeSelection(categories);
  if (arraysEqual(selected, DEFAULT_REVENUE_CATEGORIES)) {
    return 'Platform revenue';
  }
  if (selected.length === 0 || arraysEqual(selected, FINANCE_RECORD_CATEGORIES)) {
    return 'All categories';
  }
  if (selected.length === 1) {
    return FINANCE_CATEGORY_LABELS[selected[0]!];
  }
  return `${selected.length} selected`;
}

export function FinanceCategoryFilter({ value, onChange }: FinanceCategoryFilterProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = normalizeSelection(value);
  const sellerSelected = selected.includes('seller');

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  function toggleCategory(category: FinanceRecordCategory) {
    const isSelected = selected.includes(category);
    let next: FinanceRecordCategory[];

    if (isSelected) {
      next = selected.filter((item) => item !== category);
      if (category === 'seller') {
        next = next.filter((item) => item !== 'marketplace_fee');
      }
    } else {
      next = [...selected, category];
    }

    onChange(normalizeSelection(next));
  }

  return (
    <div ref={rootRef} className="relative text-sm">
      <span className="mb-1 block font-medium">Categories</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-[11rem] items-center justify-between rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-card px-3 py-2 text-left text-sm"
      >
        <span className="truncate">{selectionLabel(selected)}</span>
        <span aria-hidden className="ml-2 text-[hsl(var(--dashboard-sidebar-muted))]">
          ▾
        </span>
      </button>
      {open && (
        <div
          role="listbox"
          aria-multiselectable
          className="absolute z-20 mt-1 w-56 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-card py-1 shadow-lg"
        >
          {FINANCE_RECORD_CATEGORIES.map((category) => {
            const disabled = category === 'marketplace_fee' && !sellerSelected;
            const checked = !disabled && selected.includes(category);
            return (
              <label
                key={category}
                className={`flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-[hsl(var(--dashboard-sidebar-bg))] ${
                  disabled ? 'cursor-not-allowed opacity-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleCategory(category)}
                  className="rounded border-[hsl(var(--dashboard-sidebar-border))]"
                />
                <span>{FINANCE_CATEGORY_LABELS[category]}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function defaultRevenueFinanceCategories(): FinanceRecordCategory[] {
  return [...DEFAULT_REVENUE_CATEGORIES];
}

export function effectiveFinanceCategories(
  categories: FinanceRecordCategory[],
): FinanceRecordCategory[] {
  return normalizeSelection(categories);
}

export function includesActivityCategories(categories: FinanceRecordCategory[]): boolean {
  return categories.includes('buyer') || categories.includes('seller');
}
