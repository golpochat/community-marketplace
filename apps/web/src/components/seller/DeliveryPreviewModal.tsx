'use client';

import type { DeliveryPreview } from '@community-marketplace/types';
import { Button } from '@community-marketplace/ui';
import { formatCurrency } from '@community-marketplace/utils';

interface DeliveryPreviewModalProps {
  open: boolean;
  preview: DeliveryPreview | null;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function formatFee(price?: number) {
  if (price == null) return '—';
  return formatCurrency(price, 'EUR');
}

export function DeliveryPreviewModal({
  open,
  preview,
  loading = false,
  onConfirm,
  onClose,
}: DeliveryPreviewModalProps) {
  if (!open || !preview) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-preview-title"
      >
        <h2 id="delivery-preview-title" className="text-lg font-semibold text-gray-900">
          Preview delivery changes
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Review what buyers will see for <strong>{preview.listingTitle}</strong>.
        </p>

        {preview.wouldRequireReview && (
          <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">Admin review may be required</p>
            <ul className="mt-2 list-disc pl-5">
              {preview.reviewReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p className="mt-2">
              Your listing stays published. Pending changes are hidden from buyers until approved.
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Current (live)</h3>
            <ul className="mt-2 space-y-2 text-sm text-gray-700">
              {preview.current.length === 0 && <li className="text-gray-500">None set</li>}
              {preview.current.map((item) => (
                <li key={`${item.deliveryOptionId}-${item.customLabel ?? item.label}`}>
                  {item.label} — {formatFee(item.price)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">Proposed</h3>
            <ul className="mt-2 space-y-2 text-sm text-gray-700">
              {preview.proposed.map((item) => (
                <li key={`${item.deliveryOptionId}-${item.customLabel ?? item.label}`}>
                  {item.label} — {formatFee(item.price)}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {(preview.diff.added.length > 0 ||
          preview.diff.removed.length > 0 ||
          preview.diff.changed.length > 0) && (
          <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
            <p className="font-medium text-gray-900">Summary of changes</p>
            {preview.diff.added.length > 0 && (
              <p className="mt-1">Added: {preview.diff.added.map((i) => i.label).join(', ')}</p>
            )}
            {preview.diff.removed.length > 0 && (
              <p className="mt-1">Removed: {preview.diff.removed.map((i) => i.label).join(', ')}</p>
            )}
            {preview.diff.changed.length > 0 && (
              <p className="mt-1">Updated: {preview.diff.changed.length} option(s)</p>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Go back and edit
          </Button>
          <Button type="button" onClick={onConfirm} disabled={loading}>
            {loading ? 'Submitting…' : 'Preview looks correct — submit changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
