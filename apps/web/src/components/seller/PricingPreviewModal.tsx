'use client';

import type { PricingPreview } from '@community-marketplace/types';
import { Button } from '@community-marketplace/ui';
import { formatCurrency } from '@community-marketplace/utils';

import { ListingPriceDisplay } from '@/components/listings/listing-price-display';
import { SaleBadgeOverlay } from '@/components/listings/sale-badge-overlay';

interface PricingPreviewModalProps {
  open: boolean;
  preview: PricingPreview | null;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function formatPrice(value?: number, currency = 'EUR') {
  if (value == null) return '—';
  return formatCurrency(value, currency);
}

export function PricingPreviewModal({
  open,
  preview,
  loading = false,
  onConfirm,
  onClose,
}: PricingPreviewModalProps) {
  if (!open || !preview) return null;

  const currency = 'EUR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-preview-title"
      >
        <h2 id="pricing-preview-title" className="text-lg font-semibold text-gray-900">
          Preview pricing
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Review how prices will appear for <strong>{preview.listingTitle}</strong>.
        </p>

        {preview.wouldRequireReview && (
          <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">This discount may be reviewed by our team</p>
            <ul className="mt-2 list-disc pl-5">
              {preview.reviewReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p className="mt-2">
              Your listing stays published. Buyers keep seeing current prices until approved.
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Current (live)</h3>
            <div className="mt-2 text-sm text-gray-700">
              <p>{formatPrice(preview.current.price, currency)}</p>
              {preview.current.originalPrice != null && (
                <p className="text-gray-500 line-through">
                  Was {formatPrice(preview.current.originalPrice, currency)}
                </p>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">Proposed</h3>
            <div className="mt-2">
              <ListingPriceDisplay
                price={preview.proposed.price}
                originalPrice={preview.proposed.originalPrice}
                salePrice={preview.proposed.salePrice}
                discountPercent={preview.proposed.discountPercent}
                currency={currency}
                size="sm"
              />
              {preview.proposed.discountPercent != null && preview.savingsAmount != null && (
                <p className="mt-1 text-sm text-emerald-700">
                  {preview.proposed.discountPercent}% OFF — save{' '}
                  {formatCurrency(preview.savingsAmount, currency)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4 rounded-lg border border-gray-200 p-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Listing card preview
            </p>
            <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="line-clamp-1 text-sm font-semibold text-gray-900">
                {preview.listingTitle}
              </p>
              <ListingPriceDisplay
                price={preview.proposed.price}
                originalPrice={preview.proposed.originalPrice}
                salePrice={preview.proposed.salePrice}
                discountPercent={preview.proposed.discountPercent}
                currency={currency}
                size="card"
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Detail page preview
            </p>
            <div className="mt-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <ListingPriceDisplay
                price={preview.proposed.price}
                originalPrice={preview.proposed.originalPrice}
                salePrice={preview.proposed.salePrice}
                discountPercent={preview.proposed.discountPercent}
                currency={currency}
                size="detail"
              />
            </div>
          </div>
          {preview.proposed.salePrice != null &&
            preview.proposed.originalPrice != null &&
            preview.proposed.discountPercent != null && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Featured image badge preview
                </p>
                <div className="relative mt-2 aspect-[4/3] overflow-hidden rounded-lg border border-gray-100 bg-gray-200">
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    Cover photo
                  </div>
                  <SaleBadgeOverlay
                    originalPrice={preview.proposed.originalPrice}
                    salePrice={preview.proposed.salePrice}
                    discountPercent={preview.proposed.discountPercent}
                  />
                </div>
              </div>
            )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Go back and edit
          </Button>
          <Button type="button" onClick={onConfirm} disabled={loading}>
            {loading ? 'Saving…' : 'Confirm and save'}
          </Button>
        </div>
      </div>
    </div>
  );
}
