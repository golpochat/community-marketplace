'use client';

import { useEffect, useMemo, useState } from 'react';

import { computeListingPricing, formatCurrency } from '@community-marketplace/utils';
import { Button } from '@community-marketplace/ui';

import type { ListingDeliverySelection, ListingImage } from '@community-marketplace/types';

import { ListingPriceDisplay } from '@/components/listings/listing-price-display';
import { SaleBadgeOverlay } from '@/components/listings/sale-badge-overlay';
import type { ListingFormData } from '@/components/seller/listing-form';
import { ExistingListingPhotos } from '@/components/seller/listing-image-previews';

interface ListingPreviewDialogProps {
  open: boolean;
  data: ListingFormData;
  categoryName?: string;
  deliverySelections?: ListingDeliverySelection[];
  existingImages?: ListingImage[];
  onClose: () => void;
}

function conditionLabel(condition: ListingFormData['condition']): string {
  return condition.replace(/_/g, ' ');
}

export function ListingPreviewDialog({
  open,
  data,
  categoryName,
  deliverySelections = [],
  existingImages = [],
  onClose,
}: ListingPreviewDialogProps) {
  const fileKey = useMemo(
    () => data.images.map((f) => `${f.name}-${f.size}-${f.lastModified}`).join('|'),
    [data.images],
  );
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!open || data.images.length === 0) {
      setImageUrls([]);
      return undefined;
    }
    const urls = data.images.map((file) => URL.createObjectURL(file));
    setImageUrls(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by fileKey + open
  }, [fileKey, open]);

  if (!open) return null;

  const pricingMeta = (() => {
    try {
      if (data.salePrice.trim() === '') return null;
      const sale = Number(data.salePrice);
      if (Number.isNaN(sale) || sale < 0) return null;
      return computeListingPricing({
        salePrice: sale,
        originalPrice: data.originalPrice.trim() ? Number(data.originalPrice) : undefined,
      });
    } catch {
      return null;
    }
  })();

  const coverUrl =
    existingImages[0]?.url ?? imageUrls[0] ?? null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-preview-title"
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                Preview — not published yet
              </p>
              <h2 id="listing-preview-title" className="mt-1 text-xl font-semibold text-gray-900">
                {data.title || 'Untitled listing'}
              </h2>
            </div>
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          {coverUrl ? (
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverUrl} alt={data.title || 'Cover'} className="h-full w-full object-cover" />
              {pricingMeta?.hasSaleBadge && pricingMeta.originalPrice != null && (
                <SaleBadgeOverlay
                  originalPrice={pricingMeta.originalPrice}
                  salePrice={pricingMeta.salePrice}
                  discountPercent={pricingMeta.discountPercent}
                />
              )}
            </div>
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
              No photos selected
            </div>
          )}

          {(existingImages.length > 1 || imageUrls.length > 1) && (
            <div className="space-y-4">
              {existingImages.length > 0 && (
                <ExistingListingPhotos images={existingImages} title="Current photos" />
              )}
              {imageUrls.length > 1 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {imageUrls.slice(1).map((url, index) => (
                    <img
                      key={url}
                      src={url}
                      alt={`${data.title || 'Listing'} preview ${index + 2}`}
                      className="h-48 w-full rounded-lg border border-gray-200 object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            {pricingMeta ? (
              <ListingPriceDisplay
                price={pricingMeta.price}
                originalPrice={pricingMeta.originalPrice}
                salePrice={pricingMeta.salePrice}
                discountPercent={pricingMeta.discountPercent}
                currency="EUR"
                size="detail"
              />
            ) : (
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(0, 'EUR')}
              </p>
            )}
            <p className="text-sm text-gray-600">
              {categoryName ?? 'Category'} · {conditionLabel(data.condition)} · {data.location || 'Location'}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900">Description</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
              {data.description || 'No description provided.'}
            </p>
          </div>

          {deliverySelections.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Delivery</h3>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {deliverySelections.map((option) => (
                  <li key={`${option.deliveryOptionId}-${option.customLabel ?? option.label}`}>
                    {option.label}
                    {option.price != null ? ` — ${formatCurrency(option.price, 'EUR')}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Saving will store this listing as a <strong>draft</strong>. An administrator must approve it
            before it appears on the public marketplace.
          </p>
        </div>
      </div>
    </div>
  );
}
