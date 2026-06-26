'use client';

import Link from 'next/link';

import { SELLER_VERIFICATION_MESSAGES } from '@community-marketplace/types';

export interface VerificationModalProps {
  open: boolean;
  message?: string;
  /** When false, the modal cannot be closed without verifying (hard stop). */
  dismissible?: boolean;
  onClose?: () => void;
}

export function VerificationModal({
  open,
  message = SELLER_VERIFICATION_MESSAGES.BLOCK_VERIFICATION_REQUIRED,
  dismissible = true,
  onClose,
}: VerificationModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-modal-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 id="verification-modal-title" className="text-lg font-semibold text-gray-900">
          Verification required
        </h2>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {dismissible && onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          ) : null}
          <Link
            href="/seller/profile?tab=verification"
            className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Verify Now
          </Link>
        </div>
      </div>
    </div>
  );
}
