'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import type {
  ListingDeliverySelection,
  ListingImage,
} from '@community-marketplace/types';

import {
  ListingCreateContext,
  pickDefaultListingStoreId,
} from '@/components/seller/listing-create-context';
import {
  ListingForm,
  type ListingFormData,
} from '@/components/seller/listing-form';
import {
  VehicleListingForm,
  type VehicleFormData,
} from '@/components/seller/vehicle-listing-form';
import { useSellerStoreData } from '@/hooks/use-seller-store-data';
import { SELLER_ROUTES } from '@/lib/seller-routes';
import { isVehicleCategory } from '@/lib/vehicle-catalog';

import type { SellerCategoryOption } from '@/components/seller/listing-create-context';

export type { SellerCategoryOption };

interface ListingFormRouterProps {
  categories: SellerCategoryOption[];
  initialCategoryId?: string;
  genericInitialData?: Partial<ListingFormData>;
  vehicleInitialData?: Partial<VehicleFormData>;
  initialDeliverySelections?: ListingDeliverySelection[];
  existingImages?: ListingImage[];
  listingId?: string;
  listingStatus?: string;
  deliveryReviewStatus?: 'none' | 'pending-review' | 'rejected';
  priceReviewStatus?: 'none' | 'pending-review' | 'rejected';
  titleReviewStatus?: 'none' | 'pending-review' | 'rejected';
  titleAmendRequired?: boolean;
  liveTitle?: string;
  deliveryReviewNotes?: string;
  priceReviewNotes?: string;
  titleReviewNotes?: string;
  submitLabel?: string;
  disabled?: boolean;
  onGenericSubmit?: (data: ListingFormData) => void;
  onVehicleSubmit?: (data: VehicleFormData) => void;
  onDeliveryUpdated?: (result: { status: string; message: string }) => void;
  onPricingUpdated?: (result: { status: string; message: string }) => void;
  onRemoveExistingImage?: (imageId: string) => void | Promise<void>;
  onReorderExistingImages?: (images: ListingImage[]) => void | Promise<void>;
  onListingImagesChange?: (images: ListingImage[]) => void;
  onBoostListing?: () => void;
  removingExistingImageId?: string | null;
  reorderingImages?: boolean;
}

export function ListingFormRouter({
  categories,
  initialCategoryId,
  genericInitialData,
  vehicleInitialData,
  initialDeliverySelections = [],
  existingImages = [],
  listingId,
  listingStatus,
  deliveryReviewStatus,
  priceReviewStatus,
  titleReviewStatus,
  titleAmendRequired,
  liveTitle,
  deliveryReviewNotes,
  priceReviewNotes,
  titleReviewNotes,
  submitLabel,
  disabled,
  onGenericSubmit,
  onVehicleSubmit,
  onDeliveryUpdated,
  onPricingUpdated,
  onRemoveExistingImage,
  onReorderExistingImages,
  onListingImagesChange,
  onBoostListing,
  removingExistingImageId,
  reorderingImages,
}: ListingFormRouterProps) {
  const router = useRouter();
  const { stores, loading: storesLoading } = useSellerStoreData();
  const [storeId, setStoreId] = useState(() => pickDefaultListingStoreId(stores));
  const isCreateFlow = !listingId;

  const defaultCategoryId =
    initialCategoryId ??
    genericInitialData?.categoryId ??
    vehicleInitialData?.categoryId ??
    categories[0]?.id ??
    '';

  const [categoryId, setCategoryId] = useState(defaultCategoryId);

  useEffect(() => {
    setStoreId((current) => {
      if (current && stores.some((store) => store.id === current)) {
        return current;
      }
      return pickDefaultListingStoreId(stores);
    });
  }, [stores]);

  useEffect(() => {
    if (categoryId && categories.some((category) => category.id === categoryId)) {
      return;
    }
    const fallback = categories[0]?.id ?? '';
    if (fallback) setCategoryId(fallback);
  }, [categories, categoryId]);

  useEffect(() => {
    if (!storesLoading && isCreateFlow && stores.length === 0) {
      router.replace(SELLER_ROUTES.storefront);
    }
  }, [storesLoading, isCreateFlow, stores.length, router]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId],
  );

  const isVehicle = selectedCategory ? isVehicleCategory(selectedCategory) : false;

  const resolvedStoreId =
    storeId ||
    pickDefaultListingStoreId(stores) ||
    genericInitialData?.storeId ||
    '';

  const formDisabled = disabled || storesLoading || stores.length === 0;

  function withStoreId<T extends { storeId?: string }>(data: T): T {
    return resolvedStoreId ? { ...data, storeId: resolvedStoreId } : data;
  }

  if (storesLoading) {
    return (
      <p className="text-sm text-muted-foreground" role="status">
        Loading storefront…
      </p>
    );
  }

  if (isCreateFlow && stores.length === 0) {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-foreground">
          Set up your{' '}
          <Link href={SELLER_ROUTES.storefront} className="font-medium text-primary underline">
            storefront
          </Link>{' '}
          before creating listings.
        </p>
        <p className="text-sm text-muted-foreground">Redirecting to storefront setup…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ListingCreateContext
        stores={stores}
        storesLoading={storesLoading}
        storeId={resolvedStoreId}
        onStoreIdChange={setStoreId}
        categories={categories}
        categoryId={categoryId}
        onCategoryIdChange={setCategoryId}
        isVehicle={isVehicle}
        disabled={formDisabled}
      />

      {isVehicle ? (
        <VehicleListingForm
          categoryId={categoryId}
          initialData={vehicleInitialData}
          initialDeliverySelections={initialDeliverySelections}
          existingImages={existingImages}
          listingId={listingId}
          listingStatus={listingStatus}
          deliveryReviewStatus={deliveryReviewStatus}
          priceReviewStatus={priceReviewStatus}
          titleReviewStatus={titleReviewStatus}
          titleAmendRequired={titleAmendRequired}
          liveTitle={liveTitle}
          deliveryReviewNotes={deliveryReviewNotes}
          priceReviewNotes={priceReviewNotes}
          titleReviewNotes={titleReviewNotes}
          submitLabel={submitLabel}
          disabled={formDisabled}
          onSubmit={(data) => onVehicleSubmit?.(withStoreId(data))}
          onDeliveryUpdated={onDeliveryUpdated}
          onPricingUpdated={onPricingUpdated}
          onRemoveExistingImage={onRemoveExistingImage}
          onReorderExistingImages={onReorderExistingImages}
          onListingImagesChange={onListingImagesChange}
          onBoostListing={onBoostListing}
          removingExistingImageId={removingExistingImageId}
          reorderingImages={reorderingImages}
        />
      ) : (
        <ListingForm
          categories={categories}
          initialData={{ ...genericInitialData, categoryId }}
          initialDeliverySelections={initialDeliverySelections}
          existingImages={existingImages}
          listingId={listingId}
          listingStatus={listingStatus}
          deliveryReviewStatus={deliveryReviewStatus}
          priceReviewStatus={priceReviewStatus}
          titleReviewStatus={titleReviewStatus}
          titleAmendRequired={titleAmendRequired}
          liveTitle={liveTitle}
          deliveryReviewNotes={deliveryReviewNotes}
          priceReviewNotes={priceReviewNotes}
          titleReviewNotes={titleReviewNotes}
          submitLabel={submitLabel}
          disabled={formDisabled}
          onSubmit={(data) => onGenericSubmit?.(withStoreId(data))}
          onDeliveryUpdated={onDeliveryUpdated}
          onPricingUpdated={onPricingUpdated}
          onRemoveExistingImage={onRemoveExistingImage}
          onReorderExistingImages={onReorderExistingImages}
          onListingImagesChange={onListingImagesChange}
          onBoostListing={onBoostListing}
          removingExistingImageId={removingExistingImageId}
          reorderingImages={reorderingImages}
        />
      )}
    </div>
  );
}
