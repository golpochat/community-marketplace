"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@community-marketplace/ui";
import {
  LISTING_DESCRIPTION_HARD_MAX,
  LISTING_DESCRIPTION_SOFT_MAX,
  LISTING_TITLE_MAX_LENGTH,
  listingTitleValidationMessage,
  normalizeListingTitle,
} from "@community-marketplace/utils";
import { Button, Input, Label, Select } from "@community-marketplace/ui";
import type {
  DeliveryPreview,
  ListingCondition,
  ListingDeliverySelection,
  ListingImage,
  PricingPreview,
} from "@community-marketplace/types";
import {
  computeListingPricing,
  MAX_AUTO_APPROVE_DISCOUNT_PERCENT,
  formatCurrency,
} from "@community-marketplace/utils";

import {
  DeliveryOptionsSection,
  type DeliveryFormState,
  deliveryStateFromSelections,
  selectionsFromDeliveryState,
  useDeliveryCatalog,
  validateDeliveryForm,
} from "@/components/seller/delivery-options-section";
import { DeliveryPreviewModal } from "@/components/seller/DeliveryPreviewModal";
import { PricingPreviewModal } from "@/components/seller/PricingPreviewModal";
import {
  ExistingListingPhotos,
  SelectedFilePreviews,
} from "@/components/seller/listing-image-previews";
import { ListingPreviewDialog } from "@/components/seller/listing-preview-dialog";
import { deliveryService } from "@/services/delivery.service";
import {
  pricingInputFromForm,
  pricingService,
} from "@/services/pricing.service";

const STEPS = ["Details", "Pricing", "Pickup & delivery", "Photos", "Review"];
const MAX_LISTING_IMAGES = 10;
const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface ListingFormData {
  title: string;
  description: string;
  salePrice: string;
  originalPrice: string;
  /** @deprecated Use salePrice */
  price?: string;
  condition: ListingCondition;
  categoryId: string;
  location: string;
  storeId?: string;
  images: File[];
  delivery: DeliveryFormState;
}

const EMPTY_DELIVERY: DeliveryFormState = {
  selectedOptionIds: [],
  customFields: [],
};

const INITIAL: ListingFormData = {
  title: "",
  description: "",
  salePrice: "",
  originalPrice: "",
  condition: "good",
  categoryId: "",
  location: "",
  images: [],
  delivery: EMPTY_DELIVERY,
};

function normalizeInitialData(
  initial?: Partial<ListingFormData>,
): Partial<ListingFormData> {
  if (!initial) return {};
  const salePrice = initial.salePrice ?? initial.price ?? "";
  return { ...initial, salePrice, originalPrice: initial.originalPrice ?? "" };
}

interface ListingFormProps {
  categories?: Array<{ id: string; name: string }>;
  initialData?: Partial<ListingFormData>;
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
  onSubmit?: (data: ListingFormData) => void;
  onDeliveryUpdated?: (result: { status: string; message: string }) => void;
  onPricingUpdated?: (result: { status: string; message: string }) => void;
  onRemoveExistingImage?: (imageId: string) => void | Promise<void>;
  onReorderExistingImages?: (images: ListingImage[]) => void | Promise<void>;
  removingExistingImageId?: string | null;
  reorderingImages?: boolean;
}

export function ListingForm({
  categories = [],
  initialData,
  initialDeliverySelections = [],
  existingImages = [],
  listingId,
  listingStatus,
  deliveryReviewStatus,
  priceReviewStatus,
  deliveryReviewNotes,
  priceReviewNotes,
  submitLabel = "Save draft",
  disabled = false,
  onSubmit,
  onDeliveryUpdated,
  onPricingUpdated,
  onRemoveExistingImage,
  onReorderExistingImages,
  removingExistingImageId = null,
  reorderingImages = false,
}: ListingFormProps) {
  const { catalog, loading: catalogLoading } = useDeliveryCatalog();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ListingFormData>({
    ...INITIAL,
    ...normalizeInitialData(initialData),
    delivery: EMPTY_DELIVERY,
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [photosNotice, setPhotosNotice] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [deliveryPreview, setDeliveryPreview] =
    useState<DeliveryPreview | null>(null);
  const [showDeliveryPreview, setShowDeliveryPreview] = useState(false);
  const [deliverySubmitting, setDeliverySubmitting] = useState(false);
  const [pricingPreview, setPricingPreview] = useState<PricingPreview | null>(
    null,
  );
  const [showPricingPreview, setShowPricingPreview] = useState(false);
  const [pricingSubmitting, setPricingSubmitting] = useState(false);

  const isLiveListing =
    listingStatus === "active" || listingStatus === "paused";
  const totalPhotoCount = existingImages.length + data.images.length;
  const remainingPhotoSlots = MAX_LISTING_IMAGES - totalPhotoCount;
  const uploadAtCapacity = remainingPhotoSlots <= 0;
  const deliverySeededRef = useRef(false);
  const initialDeliveryKey = initialDeliverySelections
    .map(
      (s) =>
        `${s.deliveryOptionId}:${s.customLabel ?? ""}:${s.customPrice ?? ""}`,
    )
    .join("|");

  useEffect(() => {
    deliverySeededRef.current = false;
  }, [listingId, initialDeliveryKey]);

  useEffect(() => {
    if (catalog.length === 0 || deliverySeededRef.current) return;

    if (initialDeliverySelections.length > 0) {
      setData((prev) => ({
        ...prev,
        delivery: deliveryStateFromSelections(
          catalog,
          initialDeliverySelections,
        ),
      }));
      deliverySeededRef.current = true;
      return;
    }

    const collection = catalog.find((o) => o.zone === "COLLECTION");
    if (collection) {
      setData((prev) => ({
        ...prev,
        delivery: { selectedOptionIds: [collection.id], customFields: [] },
      }));
    }
    deliverySeededRef.current = true;
  }, [catalog, initialDeliverySelections]);

  useEffect(() => {
    if (categories.length > 0 && !data.categoryId) {
      setData((prev) => ({ ...prev, categoryId: categories[0]!.id }));
    }
  }, [categories, data.categoryId]);

  function update(patch: Partial<ListingFormData>) {
    setData((prev) => ({ ...prev, ...patch }));
    setValidationError(null);
  }

  function parseSalePrice(): number | null {
    const trimmed = data.salePrice.trim();
    if (trimmed === "") return null;
    const sale = Number(trimmed);
    return Number.isNaN(sale) ? null : sale;
  }

  function validateStep(stepIndex: number): string | null {
    if (stepIndex === 0) {
      const titleError = listingTitleValidationMessage(data.title);
      if (titleError) return titleError;
      const descriptionLength = data.description.trim().length;
      if (descriptionLength < 10)
        return "Description must be at least 10 characters.";
      if (descriptionLength > LISTING_DESCRIPTION_HARD_MAX) {
        return `Description must be at most ${LISTING_DESCRIPTION_HARD_MAX} characters.`;
      }
    }
    if (stepIndex === 1) {
      const sale = parseSalePrice();
      if (sale == null || sale < 0)
        return "Enter a valid sale price (use 0 for free items).";
      if (sale === 0 && data.originalPrice.trim()) {
        return "Clear the original price for free items.";
      }
      if (sale > 0 && data.originalPrice.trim()) {
        const original = Number(data.originalPrice);
        if (original <= 0) return "Original price must be greater than 0.";
        if (sale >= original)
          return "Sale price must be lower than original price.";
      }
      if (categories.length > 0 && !data.categoryId)
        return "Select a category.";
    }
    if (stepIndex === 2) {
      if (!data.location.trim()) return "Enter a location label.";
      return validateDeliveryForm(catalog, data.delivery);
    }
    return null;
  }

  function validateCurrentStep(): string | null {
    return validateStep(step);
  }

  function validateAllSteps(): string | null {
    for (let i = 0; i < STEPS.length; i += 1) {
      const error = validateStep(i);
      if (error) return error;
    }
    return null;
  }

  async function openDeliveryPreviewModal() {
    const error = validateDeliveryForm(catalog, data.delivery);
    if (error) {
      setValidationError(error);
      return;
    }
    if (!listingId) return;
    try {
      const selections = selectionsFromDeliveryState(catalog, data.delivery);
      const preview = await deliveryService.previewUpdate(
        listingId,
        selections,
      );
      setDeliveryPreview(preview);
      setShowDeliveryPreview(true);
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : "Failed to load delivery preview",
      );
    }
  }

  async function confirmDeliveryUpdate() {
    if (!listingId) return;
    setDeliverySubmitting(true);
    try {
      const selections = selectionsFromDeliveryState(catalog, data.delivery);
      const result = await deliveryService.updateDelivery(
        listingId,
        selections,
      );
      setShowDeliveryPreview(false);
      onDeliveryUpdated?.({
        status: result.status,
        message:
          result.status === "auto-approved"
            ? "Your delivery changes are live."
            : "Your delivery changes are pending review. Your listing stays published.",
      });
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : "Failed to update delivery",
      );
    } finally {
      setDeliverySubmitting(false);
    }
  }

  function buildLocalPricingPreview(): PricingPreview {
    const input = pricingInputFromForm(data.salePrice, data.originalPrice);
    const computed = computeListingPricing(input);
    const proposed = {
      price: computed.price,
      originalPrice: computed.originalPrice,
      salePrice: computed.salePrice,
      discountPercent: computed.discountPercent,
    };
    const wouldRequireReview =
      (computed.discountPercent ?? 0) > MAX_AUTO_APPROVE_DISCOUNT_PERCENT;
    return {
      listingId: listingId ?? "",
      listingTitle: data.title || "Listing",
      listingStatus: listingStatus ?? "draft",
      current: proposed,
      proposed,
      savingsAmount: computed.savingsAmount,
      badgeLabel: computed.badgeLabel,
      wouldRequireReview,
      reviewReasons: wouldRequireReview
        ? [`Discount exceeds ${MAX_AUTO_APPROVE_DISCOUNT_PERCENT}%`]
        : [],
    };
  }

  async function openPricingPreviewModal() {
    const error = validateAllSteps();
    if (error) {
      setValidationError(error);
      return;
    }

    try {
      const input = pricingInputFromForm(data.salePrice, data.originalPrice);
      if (listingId && isLiveListing) {
        const preview = await pricingService.previewUpdate(listingId, input);
        setPricingPreview(preview);
      } else {
        setPricingPreview(buildLocalPricingPreview());
      }
      setShowPricingPreview(true);
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : "Failed to load pricing preview",
      );
    }
  }

  async function confirmPricingSave() {
    setPricingSubmitting(true);
    try {
      const input = pricingInputFromForm(data.salePrice, data.originalPrice);
      if (listingId && isLiveListing) {
        const result = await pricingService.updatePricing(listingId, input);
        onPricingUpdated?.({
          status: result.status,
          message:
            result.status === "auto-approved"
              ? "Your price changes are live."
              : "Your price changes are pending review. Buyers still see your current prices.",
        });
      }
      setShowPricingPreview(false);
      onSubmit?.(data);
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : "Failed to save pricing",
      );
    } finally {
      setPricingSubmitting(false);
    }
  }

  function shouldSkipPricingPreview(): boolean {
    const sale = parseSalePrice();
    // Free items: no discounts, no review, nothing meaningful to preview.
    if (sale === 0) return true;
    // Draft saves: current and proposed are always identical in the local preview.
    if (!isLiveListing) return true;
    return false;
  }

  async function finalizeSubmit() {
    const error = validateAllSteps();
    if (error) {
      setValidationError(error);
      return;
    }
    if (shouldSkipPricingPreview()) {
      await confirmPricingSave();
      return;
    }
    await openPricingPreviewModal();
  }

  function handleNext() {
    const error = validateCurrentStep();
    if (error) {
      setValidationError(error);
      return;
    }
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    void finalizeSubmit();
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  function handleImagesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";

    setData((prev) => {
      const slotsLeft =
        MAX_LISTING_IMAGES - existingImages.length - prev.images.length;
      if (slotsLeft <= 0) {
        return prev;
      }

      const invalidTypeCount = selected.filter(
        (file) => !ALLOWED_IMAGE_TYPES.has(file.type),
      ).length;
      const oversized = selected.filter(
        (file) =>
          ALLOWED_IMAGE_TYPES.has(file.type) &&
          file.size > MAX_IMAGE_FILE_BYTES,
      );
      let accepted = selected.filter(
        (file) =>
          ALLOWED_IMAGE_TYPES.has(file.type) &&
          file.size <= MAX_IMAGE_FILE_BYTES,
      );

      const messages: string[] = [];
      if (accepted.length > slotsLeft) {
        messages.push(
          `You selected ${selected.length} image${selected.length === 1 ? "" : "s"}. Only ${slotsLeft} more can be added (max ${MAX_LISTING_IMAGES} total).`,
        );
        accepted = accepted.slice(0, slotsLeft);
      }
      if (invalidTypeCount > 0) {
        messages.push(
          `${invalidTypeCount} file(s) were skipped — only JPEG, PNG, or WebP are allowed.`,
        );
      }
      if (oversized.length > 0) {
        messages.push(
          `${oversized.length} file(s) exceed the 5 MB limit: ${oversized.map((file) => file.name).join(", ")}.`,
        );
      }

      setPhotosNotice(messages.length > 0 ? messages.join(" ") : null);

      if (accepted.length === 0) {
        return prev;
      }

      return { ...prev, images: [...prev.images, ...accepted] };
    });
    setValidationError(null);
  }

  function removeSelectedImage(index: number) {
    setData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setValidationError(null);
  }

  function handlePreview() {
    const error = validateCurrentStep();
    if (error) {
      setValidationError(error);
      return;
    }
    setShowPreview(true);
  }

  const saleAmount = parseSalePrice();
  const isFreeListing = saleAmount === 0;
  const selectedCategoryName = categories.find(
    (category) => category.id === data.categoryId,
  )?.name;
  const deliverySelections = selectionsFromDeliveryState(
    catalog,
    data.delivery,
  );

  let pricingSummary: ReturnType<typeof computeListingPricing> | null = null;
  try {
    if (data.salePrice.trim() !== "") {
      pricingSummary = computeListingPricing(
        pricingInputFromForm(data.salePrice, data.originalPrice),
      );
    }
  } catch {
    pricingSummary = null;
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {STEPS.map((label, idx) => (
          <div
            key={label}
            className={cn(
              "rounded-lg px-2 py-2 text-center text-xs font-medium sm:text-sm",
              idx === step
                ? "bg-[hsl(var(--dashboard-accent))] text-white"
                : "bg-[hsl(var(--dashboard-sidebar-active))] text-[hsl(var(--dashboard-sidebar-muted))]",
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {priceReviewStatus === "pending-review" && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Your price changes are pending admin review. Buyers still see your
          current prices.
        </p>
      )}

      {priceReviewStatus === "rejected" && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900">
          Your last price change was rejected.
          {priceReviewNotes
            ? ` ${priceReviewNotes}`
            : " Adjust your prices and submit again."}
        </p>
      )}

      {deliveryReviewStatus === "pending-review" && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Your delivery changes are pending admin review. Buyers still see your
          current delivery options.
        </p>
      )}

      {deliveryReviewStatus === "rejected" && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900">
          Your last delivery change was rejected.
          {deliveryReviewNotes
            ? ` ${deliveryReviewNotes}`
            : " Update your delivery options and submit again."}
        </p>
      )}

      {validationError && (
        <p className="mb-4 text-sm text-red-600">{validationError}</p>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={data.title}
              maxLength={LISTING_TITLE_MAX_LENGTH}
              onChange={(e) => update({ title: e.target.value })}
              onBlur={() => {
                const normalized = normalizeListingTitle(data.title);
                if (normalized !== data.title) update({ title: normalized });
              }}
              placeholder="What are you selling?"
            />
            <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              {data.title.trim().length}/{LISTING_TITLE_MAX_LENGTH} characters ·
              use a descriptive title
            </p>
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={data.description}
              maxLength={LISTING_DESCRIPTION_HARD_MAX}
              onChange={(e) => update({ description: e.target.value })}
              rows={5}
              className="mt-1 w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-white px-3 py-2 text-sm text-[hsl(var(--dashboard-main-fg))] focus:border-[hsl(var(--dashboard-accent))] focus:outline-none focus:ring-1 focus:ring-[hsl(var(--dashboard-accent))]"
              placeholder="Describe your item (min. 10 characters)..."
            />
            <p
              className={cn(
                "mt-1 text-xs",
                data.description.length > LISTING_DESCRIPTION_SOFT_MAX
                  ? "text-amber-700"
                  : "text-[hsl(var(--dashboard-sidebar-muted))]",
              )}
            >
              {data.description.length}/{LISTING_DESCRIPTION_HARD_MAX}{" "}
              characters
              {data.description.length > LISTING_DESCRIPTION_SOFT_MAX
                ? ` · recommended max ${LISTING_DESCRIPTION_SOFT_MAX}`
                : ""}
            </p>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <Label htmlFor="salePrice">Sale price (EUR)</Label>
              <button
                type="button"
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  isFreeListing
                    ? "border-[hsl(var(--dashboard-accent))] bg-[hsl(var(--dashboard-accent))] text-white"
                    : "border-[hsl(var(--dashboard-sidebar-border))] text-[hsl(var(--dashboard-sidebar-muted))] hover:border-[hsl(var(--dashboard-accent))]",
                )}
                onClick={() =>
                  update({
                    salePrice: isFreeListing ? "" : "0",
                    originalPrice: isFreeListing ? data.originalPrice : "",
                  })
                }
              >
                {isFreeListing ? "Free item ✓" : "Mark as free"}
              </button>
            </div>
            <Input
              id="salePrice"
              type="number"
              min="0"
              step="0.01"
              value={data.salePrice}
              onChange={(e) => update({ salePrice: e.target.value })}
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              {isFreeListing
                ? "Free items appear in free listings. Collection-only pickup is recommended on the next step."
                : "The price buyers will pay. Enter 0 to give the item away for free."}
            </p>
          </div>
          {!isFreeListing && (
            <div>
              <Label htmlFor="originalPrice">Original price (optional)</Label>
              <Input
                id="originalPrice"
                type="number"
                min="0"
                step="0.01"
                value={data.originalPrice}
                onChange={(e) => update({ originalPrice: e.target.value })}
                placeholder="Leave blank if not on sale"
              />
              <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
                Set this to show a discount badge when sale price is lower.
              </p>
            </div>
          )}
          {pricingSummary?.hasSaleBadge &&
            pricingSummary.discountPercent != null && (
              <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
                You are offering {pricingSummary.discountPercent}% OFF
                {pricingSummary.savingsAmount != null
                  ? ` (save ${formatCurrency(pricingSummary.savingsAmount, "EUR")})`
                  : ""}
              </p>
            )}
          {pricingSummary?.discountPercent != null &&
            pricingSummary.discountPercent >
              MAX_AUTO_APPROVE_DISCOUNT_PERCENT && (
              <p className="rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-900">
                Large discounts may be reviewed by our team before going live
                for buyers.
              </p>
            )}
          {data.originalPrice.trim() &&
            data.salePrice.trim() &&
            Number(data.salePrice) >= Number(data.originalPrice) && (
              <p className="text-sm text-red-600">
                Sale price must be lower than original price.
              </p>
            )}
          <div>
            <Label htmlFor="condition">Condition</Label>
            <Select
              id="condition"
              value={data.condition}
              onChange={(e) =>
                update({ condition: e.target.value as ListingCondition })
              }
            >
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Needs Work</option>
            </Select>
          </div>
          {categories.length > 0 && (
            <div>
              <Label htmlFor="categoryId">Category</Label>
              <Select
                id="categoryId"
                value={data.categoryId}
                onChange={(e) => update({ categoryId: e.target.value })}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={data.location}
              onChange={(e) => update({ location: e.target.value })}
              placeholder="City or area (e.g. Dublin)"
            />
            <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Where buyers can collect the item or where delivery starts from.
            </p>
          </div>

          <div className="border-t border-[hsl(var(--dashboard-sidebar-border))] pt-6">
            {isFreeListing && (
              <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
                Free items work best with <strong>Collection only</strong> —
                buyers pick up at your location with no delivery fee.
              </p>
            )}
            {catalogLoading ? (
              <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                Loading delivery options…
              </p>
            ) : (
              <>
                <DeliveryOptionsSection
                  catalog={catalog}
                  value={data.delivery}
                  onChange={(delivery) => update({ delivery })}
                  disabled={disabled}
                />
                {isLiveListing && listingId && (
                  <div className="mt-4 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.35)] p-4">
                    <p className="text-sm text-[hsl(var(--dashboard-main-fg))]">
                      This listing is live. Delivery changes require a preview
                      and may be reviewed before going live for buyers.
                    </p>
                    <Button
                      type="button"
                      className="mt-3"
                      onClick={() => void openDeliveryPreviewModal()}
                      disabled={disabled || deliverySubmitting}
                    >
                      Preview &amp; submit delivery changes
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="images">Photos (optional)</Label>
            <input
              id="images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={disabled || uploadAtCapacity}
              onChange={handleImagesChange}
              className={cn(
                "mt-1 block w-full text-sm text-[hsl(var(--dashboard-main-fg))]",
                uploadAtCapacity && "cursor-not-allowed opacity-50",
              )}
            />
            <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              {uploadAtCapacity
                ? `You have ${totalPhotoCount} of ${MAX_LISTING_IMAGES} photos. Remove one below to add another.`
                : `${totalPhotoCount} of ${MAX_LISTING_IMAGES} photos selected. You can add ${remainingPhotoSlots} more. JPEG, PNG, or WebP. Max 5 MB each.`}
            </p>
            {photosNotice && (
              <p className="mt-2 text-sm text-amber-800">{photosNotice}</p>
            )}
          </div>
          {existingImages.length > 0 && (
            <ExistingListingPhotos
              images={existingImages}
              onRemove={onRemoveExistingImage}
              removingId={removingExistingImageId}
              removeDisabled={disabled || reorderingImages}
              sortable={!!onReorderExistingImages}
              onReorder={onReorderExistingImages}
              reordering={reorderingImages}
            />
          )}
          {data.images.length > 0 && (
            <SelectedFilePreviews
              files={data.images}
              onRemove={removeSelectedImage}
              onReorder={(files) =>
                setData((prev) => ({ ...prev, images: files }))
              }
              title={
                existingImages.length > 0
                  ? `New photos to upload (${data.images.length})`
                  : `Selected photos (${data.images.length} of ${MAX_LISTING_IMAGES})`
              }
            />
          )}
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {isLiveListing ? (
              <>
                Non-delivery changes will be saved. Use the Pickup &amp;
                delivery step to preview and submit delivery updates separately.
              </>
            ) : (
              <>
                Your listing will be saved as a <strong>draft</strong>. An
                administrator must approve it before it appears on the public
                marketplace.
              </>
            )}
          </p>
          <div className="space-y-3 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.35)] p-4 text-sm text-[hsl(var(--dashboard-main-fg))]">
            <p>
              <span className="font-medium">Title:</span> {data.title || "—"}
            </p>
            <p>
              <span className="font-medium">Price:</span>{" "}
              {isFreeListing
                ? "Free"
                : pricingSummary
                  ? formatCurrency(pricingSummary.price, "EUR")
                  : data.salePrice || "—"}
              {pricingSummary?.hasSaleBadge &&
                pricingSummary.originalPrice != null && (
                  <span className="ml-2 text-gray-500 line-through">
                    {formatCurrency(pricingSummary.originalPrice, "EUR")}
                  </span>
                )}
            </p>
            <p>
              <span className="font-medium">Category:</span>{" "}
              {selectedCategoryName || "—"}
            </p>
            <p>
              <span className="font-medium">Condition:</span> {data.condition}
            </p>
            <p>
              <span className="font-medium">Location:</span>{" "}
              {data.location || "—"}
            </p>
            <p>
              <span className="font-medium">Delivery:</span>{" "}
              {deliverySelections.map((s) => s.label).join(", ") || "—"}
            </p>
            <p>
              <span className="font-medium">Photos:</span>{" "}
              {totalPhotoCount > 0
                ? `${existingImages.length} current, ${data.images.length} new (${totalPhotoCount} total)`
                : "None selected"}
            </p>
          </div>
        </div>
      )}

      <ListingPreviewDialog
        open={showPreview}
        data={data}
        categoryName={selectedCategoryName}
        deliverySelections={deliverySelections}
        existingImages={existingImages}
        onClose={() => setShowPreview(false)}
      />

      <PricingPreviewModal
        open={showPricingPreview}
        preview={pricingPreview}
        loading={pricingSubmitting}
        onConfirm={() => void confirmPricingSave()}
        onClose={() => setShowPricingPreview(false)}
      />

      <DeliveryPreviewModal
        open={showDeliveryPreview}
        preview={deliveryPreview}
        loading={deliverySubmitting}
        onConfirm={() => void confirmDeliveryUpdate()}
        onClose={() => setShowDeliveryPreview(false)}
      />

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={step === 0 || disabled}
          className="w-full sm:w-auto"
        >
          Back
        </Button>
        <div className="flex flex-col gap-3 sm:flex-row">
          {step === STEPS.length - 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={disabled}
              className="w-full sm:w-auto"
            >
              Preview listing
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={disabled || catalogLoading || pricingSubmitting}
            className="w-full sm:w-auto"
          >
            {step === STEPS.length - 1 ? submitLabel : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
