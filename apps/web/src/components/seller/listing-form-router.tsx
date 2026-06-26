"use client";

import { useMemo, useState } from "react";

import type {
  ListingDeliverySelection,
  ListingImage,
} from "@community-marketplace/types";
import { Label, Select } from "@community-marketplace/ui";

import {
  ListingForm,
  type ListingFormData,
} from "@/components/seller/listing-form";
import {
  VehicleListingForm,
  type VehicleFormData,
} from "@/components/seller/vehicle-listing-form";
import { isVehicleCategory } from "@/lib/vehicle-catalog";

export type SellerCategoryOption = {
  id: string;
  name: string;
  slug?: string;
};

interface ListingFormRouterProps {
  categories: SellerCategoryOption[];
  initialCategoryId?: string;
  genericInitialData?: Partial<ListingFormData>;
  vehicleInitialData?: Partial<VehicleFormData>;
  initialDeliverySelections?: ListingDeliverySelection[];
  existingImages?: ListingImage[];
  listingId?: string;
  listingStatus?: string;
  deliveryReviewStatus?: "none" | "pending-review" | "rejected";
  priceReviewStatus?: "none" | "pending-review" | "rejected";
  deliveryReviewNotes?: string;
  priceReviewNotes?: string;
  submitLabel?: string;
  disabled?: boolean;
  onGenericSubmit?: (data: ListingFormData) => void;
  onVehicleSubmit?: (data: VehicleFormData) => void;
  onDeliveryUpdated?: (result: { status: string; message: string }) => void;
  onPricingUpdated?: (result: { status: string; message: string }) => void;
  onRemoveExistingImage?: (imageId: string) => void | Promise<void>;
  onReorderExistingImages?: (images: ListingImage[]) => void | Promise<void>;
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
  deliveryReviewNotes,
  priceReviewNotes,
  submitLabel,
  disabled,
  onGenericSubmit,
  onVehicleSubmit,
  onDeliveryUpdated,
  onPricingUpdated,
  onRemoveExistingImage,
  onReorderExistingImages,
  removingExistingImageId,
  reorderingImages,
}: ListingFormRouterProps) {
  const defaultCategoryId =
    initialCategoryId ??
    genericInitialData?.categoryId ??
    vehicleInitialData?.categoryId ??
    categories[0]?.id ??
    "";

  const [categoryId, setCategoryId] = useState(defaultCategoryId);

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  );

  const isVehicle = selectedCategory
    ? isVehicleCategory(selectedCategory)
    : false;

  return (
    <div className="space-y-6">
      {categories.length > 1 && (
        <div>
          <Label htmlFor="listing-category">Category</Label>
          <Select
            id="listing-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={disabled}
            className="mt-1"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
            {isVehicle
              ? "Vehicle listings use the structured vehicle form."
              : "Standard listings use the general item form."}
          </p>
        </div>
      )}

      {isVehicle ? (
        <VehicleListingForm
          categories={categories}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          initialData={vehicleInitialData}
          initialDeliverySelections={initialDeliverySelections}
          existingImages={existingImages}
          listingId={listingId}
          listingStatus={listingStatus}
          deliveryReviewStatus={deliveryReviewStatus}
          priceReviewStatus={priceReviewStatus}
          deliveryReviewNotes={deliveryReviewNotes}
          priceReviewNotes={priceReviewNotes}
          submitLabel={submitLabel}
          disabled={disabled}
          onSubmit={onVehicleSubmit}
          onDeliveryUpdated={onDeliveryUpdated}
          onPricingUpdated={onPricingUpdated}
          onRemoveExistingImage={onRemoveExistingImage}
          onReorderExistingImages={onReorderExistingImages}
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
          deliveryReviewNotes={deliveryReviewNotes}
          priceReviewNotes={priceReviewNotes}
          submitLabel={submitLabel}
          disabled={disabled}
          onSubmit={onGenericSubmit}
          onDeliveryUpdated={onDeliveryUpdated}
          onPricingUpdated={onPricingUpdated}
          onRemoveExistingImage={onRemoveExistingImage}
          onReorderExistingImages={onReorderExistingImages}
          removingExistingImageId={removingExistingImageId}
          reorderingImages={reorderingImages}
        />
      )}
    </div>
  );
}
