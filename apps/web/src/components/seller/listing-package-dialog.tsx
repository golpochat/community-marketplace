'use client';

import { useState } from 'react';

import type { ListingPackageType } from '@community-marketplace/types';

import type { ListingPackageOption } from '@/lib/listing-package-options';
import { LISTING_PACKAGE_OPTIONS } from '@/lib/listing-package-options';

interface ListingPackageDialogProps {
  open: boolean;
  title: string;
  confirmLabel?: string;
  defaultPackage?: ListingPackageType;
  options?: ListingPackageOption[];
  onClose: () => void;
  onConfirm: (packageType: ListingPackageType) => void;
}

export function ListingPackageDialog({
  open,
  title,
  confirmLabel = 'Confirm',
  defaultPackage = 'FREE',
  options = LISTING_PACKAGE_OPTIONS,
  onClose,
  onConfirm,
}: ListingPackageDialogProps) {
  const [selected, setSelected] = useState<ListingPackageType>(defaultPackage);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal
        aria-labelledby="package-dialog-title"
        className="w-full max-w-md rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] p-6 shadow-lg"
      >
        <h2 id="package-dialog-title" className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]">
          {title}
        </h2>
        <p className="mt-1 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">Choose how long your listing stays live.</p>
        <div className="mt-4 space-y-2">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)]"
            >
              <input
                type="radio"
                name="listing-package"
                value={option.value}
                checked={selected === option.value}
                onChange={() => setSelected(option.value)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">{option.label}</span>
                <span className="block text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selected)}
            className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
