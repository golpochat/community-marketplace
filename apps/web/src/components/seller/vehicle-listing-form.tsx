"use client";

import { useEffect, useRef, useState } from "react";

import type {
  DeliveryPreview,
  ListingCondition,
  ListingDeliverySelection,
  ListingImage,
  PricingPreview,
} from "@community-marketplace/types";
import { cn } from "@community-marketplace/ui";
import { Button, Input, Label, Select } from "@community-marketplace/ui";
import {
  computeListingPricing,
  formatCurrency,
  MAX_AUTO_APPROVE_DISCOUNT_PERCENT,
  buildVehicleDisplayTitle,
} from "@community-marketplace/utils";

import { DeliveryPreviewModal } from "@/components/seller/DeliveryPreviewModal";
import { PricingPreviewModal } from "@/components/seller/PricingPreviewModal";
import {
  ExistingListingPhotos,
  SelectedFilePreviews,
} from "@/components/seller/listing-image-previews";
import { deliveryService } from "@/services/delivery.service";
import {
  pricingInputFromForm,
  pricingService,
} from "@/services/pricing.service";
import {
  buildVehicleDeliverySelections,
  inferVehicleDeliveryMode,
  vehicleDeliveryFeesFromSelections,
  VEHICLE_DELIVERY_PRESETS,
  type VehicleDeliveryMode,
} from "@/components/seller/vehicle-delivery.helpers";
import {
  VehicleHybridSelect,
  VehicleMakeModelFields,
} from "@/components/seller/vehicle-hybrid-select";
import { useDeliveryCatalog } from "@/components/seller/delivery-options-section";
import {
  VEHICLE_AUCTION_GRADES,
  VEHICLE_BODY_TYPES,
  VEHICLE_COLOURS,
  VEHICLE_CONDITION_OPTIONS,
  VEHICLE_DOORS,
  VEHICLE_ENGINE_SIZES,
  VEHICLE_FUEL_TYPES,
  VEHICLE_MAKES,
  VEHICLE_SEATS,
  VEHICLE_TRANSMISSIONS,
  buildVehicleListingTitle,
  modelsForMake,
  vehicleYearOptions,
} from "@/lib/vehicle-catalog";
import {
  buildVehicleDescription,
  vehicleAttributesFromForm,
} from "@/lib/vehicle-listing-payload";

const STEPS = [
  "Overview",
  "Technical",
  "Registration",
  "Condition",
  "Price & delivery",
  "Photos",
  "Review",
] as const;

const MAX_LISTING_IMAGES = 10;
const MAX_IMAGE_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export interface VehicleFormData {
  categoryId: string;
  storeId?: string;
  location: string;
  make: string;
  model: string;
  year: string;
  bodyType: string;
  color: string;
  engineSize: string;
  fuelType: string;
  transmission: string;
  mileage: string;
  mileageUnit: "km" | "mi";
  chassis: string;
  seats: string;
  doors: string;
  vin: string;
  nctExpiry: string;
  roadTaxExpiry: string;
  owners: string;
  auctionGrade: string;
  condition: ListingCondition | "";
  customCondition: string;
  sellerNotes: string;
  salePrice: string;
  originalPrice: string;
  deliveryMode: VehicleDeliveryMode;
  customDeliveryLabel: string;
  feeDublin: string;
  feeIreland: string;
  images: File[];
}

const INITIAL: VehicleFormData = {
  categoryId: "",
  location: "",
  make: "",
  model: "",
  year: "",
  bodyType: "",
  color: "",
  engineSize: "",
  fuelType: "",
  transmission: "",
  mileage: "",
  mileageUnit: "km",
  chassis: "",
  seats: "",
  doors: "",
  vin: "",
  nctExpiry: "",
  roadTaxExpiry: "",
  owners: "",
  auctionGrade: "",
  condition: "",
  customCondition: "",
  sellerNotes: "",
  salePrice: "",
  originalPrice: "",
  deliveryMode: "collection",
  customDeliveryLabel: "",
  feeDublin: "",
  feeIreland: "",
  images: [],
};

interface VehicleListingFormProps {
  categories?: Array<{ id: string; name: string; slug?: string }>;
  categoryId: string;
  onCategoryChange?: (categoryId: string) => void;
  initialData?: Partial<VehicleFormData>;
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
  onSubmit?: (data: VehicleFormData) => void;
  onDeliveryUpdated?: (result: { status: string; message: string }) => void;
  onPricingUpdated?: (result: { status: string; message: string }) => void;
  onRemoveExistingImage?: (imageId: string) => void | Promise<void>;
  onReorderExistingImages?: (images: ListingImage[]) => void | Promise<void>;
  removingExistingImageId?: string | null;
  reorderingImages?: boolean;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export function VehicleListingForm({
  categories = [],
  categoryId,
  onCategoryChange,
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
}: VehicleListingFormProps) {
  const { catalog, loading: catalogLoading } = useDeliveryCatalog();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<VehicleFormData>({
    ...INITIAL,
    ...initialData,
    categoryId,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [photosNotice, setPhotosNotice] = useState<string | null>(null);
  const [deliveryPreview, setDeliveryPreview] =
    useState<DeliveryPreview | null>(null);
  const [showDeliveryPreview, setShowDeliveryPreview] = useState(false);
  const [deliverySubmitting, setDeliverySubmitting] = useState(false);
  const [pricingPreview, setPricingPreview] = useState<PricingPreview | null>(
    null,
  );
  const [showPricingPreview, setShowPricingPreview] = useState(false);
  const [pricingSubmitting, setPricingSubmitting] = useState(false);

  const deliverySeededRef = useRef(false);
  const initialDeliveryKey = initialDeliverySelections
    .map((s) => `${s.deliveryOptionId}:${s.customPrice ?? ""}`)
    .join("|");

  const isLiveListing =
    listingStatus === "active" || listingStatus === "paused";
  const totalPhotoCount = existingImages.length + data.images.length;
  const remainingPhotoSlots = MAX_LISTING_IMAGES - totalPhotoCount;
  const uploadAtCapacity = remainingPhotoSlots <= 0;
  const yearOptions = vehicleYearOptions();

  function deliverySelectionsArgs() {
    return [
      catalog,
      data.deliveryMode,
      data.feeDublin,
      data.feeIreland,
      data.customDeliveryLabel,
    ] as const;
  }

  function handleConditionChange(value: string) {
    const preset = VEHICLE_CONDITION_OPTIONS.find((o) => o.value === value);
    if (preset) {
      update({ condition: preset.value, customCondition: "" });
      return;
    }
    update({ condition: "", customCondition: value });
  }

  function conditionDisplayValue(): string {
    if (data.customCondition.trim()) return data.customCondition.trim();
    return data.condition;
  }

  function handleDeliveryChange(value: string) {
    const preset = VEHICLE_DELIVERY_PRESETS.find((p) => p.value === value);
    if (preset) {
      update({ deliveryMode: preset.value, customDeliveryLabel: "" });
      return;
    }
    update({ deliveryMode: "custom", customDeliveryLabel: value });
  }

  function deliveryDisplayValue(): string {
    if (data.deliveryMode === "custom") return data.customDeliveryLabel;
    return data.deliveryMode;
  }

  useEffect(() => {
    setData((prev) => ({ ...prev, categoryId }));
  }, [categoryId]);

  useEffect(() => {
    deliverySeededRef.current = false;
  }, [listingId, initialDeliveryKey]);

  useEffect(() => {
    if (deliverySeededRef.current || initialDeliverySelections.length === 0)
      return;
    const mode = inferVehicleDeliveryMode(initialDeliverySelections);
    const fees = vehicleDeliveryFeesFromSelections(initialDeliverySelections);
    setData((prev) => ({
      ...prev,
      deliveryMode: mode,
      feeDublin: fees.dublin,
      feeIreland: fees.ireland,
      customDeliveryLabel: fees.customLabel,
    }));
    deliverySeededRef.current = true;
  }, [initialDeliverySelections]);

  function update(patch: Partial<VehicleFormData>) {
    setData((prev) => {
      const next = { ...prev, ...patch };
      if (patch.make != null && patch.make !== prev.make) {
        next.model = "";
      }
      return next;
    });
    setFieldErrors({});
    setValidationError(null);
  }

  function validateRequiredFields(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!data.make.trim()) errors.make = "Select a make";
    if (!data.model.trim()) errors.model = "Select a model";
    if (!data.year.trim()) errors.year = "Select a year";
    if (!data.fuelType.trim()) errors.fuelType = "Select fuel type";
    if (!data.transmission.trim())
      errors.transmission = "Select transmission";
    if (!data.mileage.trim()) errors.mileage = "Enter mileage";
    else if (Number.isNaN(Number(data.mileage)) || Number(data.mileage) < 0)
      errors.mileage = "Enter a valid mileage";
    if (!data.salePrice.trim()) errors.salePrice = "Enter a price";
    else if (Number.isNaN(Number(data.salePrice)) || Number(data.salePrice) < 0)
      errors.salePrice = "Enter a valid price";
    return errors;
  }

  function validateStep(stepIndex: number): Record<string, string> {
    const errors: Record<string, string> = {};
    if (stepIndex === 0) {
      if (!data.make.trim()) errors.make = "Select a make";
      if (!data.model.trim()) errors.model = "Select a model";
      if (!data.year.trim()) errors.year = "Select a year";
    }
    if (stepIndex === 1) {
      if (!data.fuelType.trim()) errors.fuelType = "Select fuel type";
      if (!data.transmission.trim())
        errors.transmission = "Select transmission";
      if (!data.mileage.trim()) errors.mileage = "Enter mileage";
      else if (Number.isNaN(Number(data.mileage)) || Number(data.mileage) < 0)
        errors.mileage = "Enter a valid mileage";
    }
    if (stepIndex === 4) {
      if (!data.salePrice.trim()) errors.salePrice = "Enter a price";
      else if (Number.isNaN(Number(data.salePrice)) || Number(data.salePrice) < 0)
        errors.salePrice = "Enter a valid price";
      if (data.originalPrice.trim()) {
        const sale = Number(data.salePrice);
        const original = Number(data.originalPrice);
        if (original <= 0) errors.originalPrice = "Original price must be greater than 0";
        else if (sale >= original)
          errors.originalPrice = "Discount price must be lower than original";
      }
      if (!data.location.trim()) errors.location = "Enter a location";
    }
    return errors;
  }

  function validateAllSteps(): string | null {
    const errors = validateRequiredFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return "Complete all required fields before publishing.";
    }
    if (!data.location.trim()) return "Enter a location.";
    return null;
  }

  async function openDeliveryPreviewModal() {
    if (!listingId || catalog.length === 0) return;
    try {
      const selections = buildVehicleDeliverySelections(...deliverySelectionsArgs());
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
      const selections = buildVehicleDeliverySelections(...deliverySelectionsArgs());
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
            : "Your delivery changes are pending review.",
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
    const attrs = vehicleAttributesFromForm(data);
    return {
      listingId: listingId ?? "",
      listingTitle:
        buildVehicleDisplayTitle(attrs.year, attrs.make, attrs.model, attrs) ||
        buildVehicleListingTitle(attrs.year, attrs.make, attrs.model),
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
              : "Your price changes are pending review.",
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

  async function finalizeSubmit() {
    const error = validateAllSteps();
    if (error) {
      setValidationError(error);
      return;
    }
    const sale = Number(data.salePrice);
    if (sale > 0 && isLiveListing) {
      try {
        const input = pricingInputFromForm(data.salePrice, data.originalPrice);
        const preview = await pricingService.previewUpdate(listingId!, input);
        setPricingPreview(preview);
        setShowPricingPreview(true);
        return;
      } catch {
        setPricingPreview(buildLocalPricingPreview());
        setShowPricingPreview(true);
        return;
      }
    }
    await confirmPricingSave();
  }

  function handleNext() {
    const errors = validateStep(step);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
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
      if (slotsLeft <= 0) return prev;
      let accepted = selected.filter(
        (file) =>
          ALLOWED_IMAGE_TYPES.has(file.type) &&
          file.size <= MAX_IMAGE_FILE_BYTES,
      );
      if (accepted.length > slotsLeft) accepted = accepted.slice(0, slotsLeft);
      if (accepted.length === 0) return prev;
      return { ...prev, images: [...prev.images, ...accepted] };
    });
    setValidationError(null);
  }

  function removeSelectedImage(index: number) {
    setData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  }

  const attrs = vehicleAttributesFromForm(data);
  const previewTitle =
    buildVehicleDisplayTitle(attrs.year ?? attrs.yearText, attrs.make, attrs.model, attrs) ||
    buildVehicleListingTitle(attrs.year ?? attrs.yearText, attrs.make, attrs.model);
  let pricingSummary: ReturnType<typeof computeListingPricing> | null = null;
  try {
    if (data.salePrice.trim()) {
      pricingSummary = computeListingPricing(
        pricingInputFromForm(data.salePrice, data.originalPrice),
      );
    }
  } catch {
    pricingSummary = null;
  }

  const deliveryLabels: Record<Exclude<VehicleDeliveryMode, "custom">, string> = {
    collection: "Collection only",
    delivery: "Delivery available",
    both: "Delivery & collection",
  };
  const reviewDeliveryLabel =
    data.deliveryMode === "custom"
      ? data.customDeliveryLabel
      : deliveryLabels[data.deliveryMode as Exclude<VehicleDeliveryMode, "custom">];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {STEPS.map((label, idx) => (
          <div
            key={label}
            className={cn(
              "rounded-lg px-2 py-2 text-center text-xs font-medium",
              idx === step
                ? "bg-[hsl(var(--dashboard-accent))] text-white"
                : "bg-[hsl(var(--dashboard-sidebar-active))] text-[hsl(var(--dashboard-sidebar-muted))]",
            )}
          >
            {label}
          </div>
        ))}
      </div>

      {validationError && (
        <p className="mb-4 text-sm text-red-600">{validationError}</p>
      )}

      {step === 0 && (
        <div className="space-y-4">
          {categories.length > 1 && onCategoryChange && (
            <div>
              <Label htmlFor="vehicle-category">Category</Label>
              <Select
                id="vehicle-category"
                value={categoryId}
                onChange={(e) => onCategoryChange(e.target.value)}
                disabled={disabled}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <VehicleMakeModelFields
            make={data.make}
            model={data.model}
            makes={VEHICLE_MAKES}
            modelsForMake={modelsForMake}
            onMakeChange={(make) => update({ make, model: "" })}
            onModelChange={(model) => update({ model })}
            disabled={disabled}
            makeRequired
            modelRequired
            makeError={fieldErrors.make}
            modelError={fieldErrors.model}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <VehicleHybridSelect
              id="year"
              label="Year"
              value={data.year}
              options={yearOptions}
              onChange={(year) => update({ year })}
              disabled={disabled}
              required
              error={fieldErrors.year}
              emptyLabel="Select year"
              customPlaceholder="Enter year"
            />
            <VehicleHybridSelect
              id="bodyType"
              label="Body type"
              value={data.bodyType}
              options={VEHICLE_BODY_TYPES}
              onChange={(bodyType) => update({ bodyType })}
              disabled={disabled}
              emptyLabel="Select body type"
              customPlaceholder="Enter body type"
            />
          </div>
          <VehicleHybridSelect
            id="color"
            label="Colour"
            value={data.color}
            options={VEHICLE_COLOURS}
            onChange={(color) => update({ color })}
            disabled={disabled}
            emptyLabel="Select colour"
            customPlaceholder="Enter colour"
          />
          {previewTitle && (
            <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
              Buyers will see: <span className="font-medium text-gray-900">{previewTitle}</span>
            </p>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <VehicleHybridSelect
              id="engineSize"
              label="Engine size (L)"
              value={data.engineSize}
              options={VEHICLE_ENGINE_SIZES}
              onChange={(engineSize) => update({ engineSize })}
              disabled={disabled}
              emptyLabel="Select engine size"
              customPlaceholder="Enter engine size"
              formatOption={(v) => `${v} L`}
            />
            <VehicleHybridSelect
              id="fuelType"
              label="Fuel type"
              value={data.fuelType}
              options={VEHICLE_FUEL_TYPES}
              onChange={(fuelType) => update({ fuelType })}
              disabled={disabled}
              required
              error={fieldErrors.fuelType}
              emptyLabel="Select fuel type"
              customPlaceholder="Enter fuel type"
            />
          </div>
          <VehicleHybridSelect
            id="transmission"
            label="Transmission"
            value={data.transmission}
            options={VEHICLE_TRANSMISSIONS}
            onChange={(transmission) => update({ transmission })}
            disabled={disabled}
            required
            error={fieldErrors.transmission}
            emptyLabel="Select transmission"
            customPlaceholder="Enter transmission"
          />
          <div>
            <Label htmlFor="mileage">Mileage *</Label>
            <div className="flex gap-2">
              <Input
                id="mileage"
                type="number"
                min="0"
                value={data.mileage}
                onChange={(e) => update({ mileage: e.target.value })}
                placeholder="e.g. 85000"
                disabled={disabled}
                className="flex-1"
              />
              <div className="flex rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] p-0.5">
                {(["km", "mi"] as const).map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    className={cn(
                      "rounded-md px-3 py-2 text-xs font-medium",
                      data.mileageUnit === unit
                        ? "bg-[hsl(var(--dashboard-accent))] text-white"
                        : "text-[hsl(var(--dashboard-sidebar-muted))]",
                    )}
                    onClick={() => update({ mileageUnit: unit })}
                    disabled={disabled}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
            <FieldError message={fieldErrors.mileage} />
          </div>
          <div>
            <Label htmlFor="chassis">Chassis code</Label>
            <Input
              id="chassis"
              value={data.chassis}
              onChange={(e) => update({ chassis: e.target.value })}
              placeholder="e.g. ZE2"
              disabled={disabled}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <VehicleHybridSelect
              id="seats"
              label="Seats"
              value={data.seats}
              options={VEHICLE_SEATS}
              onChange={(seats) => update({ seats })}
              disabled={disabled}
              emptyLabel="Select seats"
              customPlaceholder="Enter seats"
            />
            <VehicleHybridSelect
              id="doors"
              label="Doors"
              value={data.doors}
              options={VEHICLE_DOORS}
              onChange={(doors) => update({ doors })}
              disabled={disabled}
              emptyLabel="Select doors"
              customPlaceholder="Enter doors"
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="nctExpiry">NCT expiry</Label>
              <Input
                id="nctExpiry"
                type="date"
                value={data.nctExpiry}
                onChange={(e) => update({ nctExpiry: e.target.value })}
                disabled={disabled}
              />
            </div>
            <div>
              <Label htmlFor="roadTaxExpiry">Road tax expiry</Label>
              <Input
                id="roadTaxExpiry"
                type="date"
                value={data.roadTaxExpiry}
                onChange={(e) => update({ roadTaxExpiry: e.target.value })}
                disabled={disabled}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="vin">VIN (optional)</Label>
            <Input
              id="vin"
              value={data.vin}
              onChange={(e) => update({ vin: e.target.value.toUpperCase() })}
              maxLength={17}
              placeholder="17-character VIN"
              disabled={disabled}
            />
            <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Optional. Helps prevent the same car being listed twice. Each vehicle needs its own listing.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="owners">Previous owners</Label>
              <Input
                id="owners"
                type="number"
                min="0"
                max="20"
                value={data.owners}
                onChange={(e) => update({ owners: e.target.value })}
                disabled={disabled}
              />
            </div>
            <VehicleHybridSelect
              id="auctionGrade"
              label="Auction grade"
              value={data.auctionGrade}
              options={VEHICLE_AUCTION_GRADES}
              onChange={(auctionGrade) => update({ auctionGrade })}
              disabled={disabled}
              emptyLabel="Select grade"
              customPlaceholder="Enter auction grade"
            />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <VehicleHybridSelect
            id="condition"
            label="Condition"
            value={conditionDisplayValue()}
            options={VEHICLE_CONDITION_OPTIONS.map((o) => o.value)}
            formatOption={(value) =>
              VEHICLE_CONDITION_OPTIONS.find((o) => o.value === value)?.label ??
              value
            }
            onChange={handleConditionChange}
            disabled={disabled}
            emptyLabel="Select condition"
            customPlaceholder="Describe condition"
          />
          <div>
            <Label htmlFor="sellerNotes">Seller notes</Label>
            <textarea
              id="sellerNotes"
              value={data.sellerNotes}
              onChange={(e) => update({ sellerNotes: e.target.value })}
              rows={5}
              disabled={disabled}
              className="mt-1 w-full rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-white px-3 py-2 text-sm"
              placeholder="Service history, extras, known issues…"
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div>
            <Label htmlFor="salePrice">Price (EUR) *</Label>
            <Input
              id="salePrice"
              type="number"
              min="0"
              step="0.01"
              value={data.salePrice}
              onChange={(e) => update({ salePrice: e.target.value })}
              disabled={disabled}
            />
            <FieldError message={fieldErrors.salePrice} />
          </div>
          <div>
            <Label htmlFor="originalPrice">Original price / discount (optional)</Label>
            <Input
              id="originalPrice"
              type="number"
              min="0"
              step="0.01"
              value={data.originalPrice}
              onChange={(e) => update({ originalPrice: e.target.value })}
              disabled={disabled}
              placeholder="Was price before discount"
            />
            <FieldError message={fieldErrors.originalPrice} />
            {pricingSummary?.discountPercent != null && (
              <p className="mt-1 text-xs text-green-700">
                {pricingSummary.badgeLabel} · Save{" "}
                {formatCurrency(pricingSummary.savingsAmount ?? 0, "EUR")}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={data.location}
              onChange={(e) => update({ location: e.target.value })}
              placeholder="e.g. Dublin 8"
              disabled={disabled}
            />
            <FieldError message={fieldErrors.location} />
          </div>
          <VehicleHybridSelect
            id="deliveryMode"
            label="Delivery options"
            value={deliveryDisplayValue()}
            options={VEHICLE_DELIVERY_PRESETS.map((p) => p.value)}
            formatOption={(value) =>
              VEHICLE_DELIVERY_PRESETS.find((p) => p.value === value)?.label ??
              value
            }
            onChange={handleDeliveryChange}
            disabled={disabled || catalogLoading}
            emptyLabel="Select delivery option"
            customPlaceholder="Describe delivery arrangement"
          />
          {(data.deliveryMode === "delivery" || data.deliveryMode === "both") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="feeDublin">Delivery fee — within Dublin (optional)</Label>
                <Input
                  id="feeDublin"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.feeDublin}
                  onChange={(e) => update({ feeDublin: e.target.value })}
                  placeholder="Default from catalog"
                  disabled={disabled}
                />
              </div>
              <div>
                <Label htmlFor="feeIreland">Delivery fee — within Ireland (optional)</Label>
                <Input
                  id="feeIreland"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.feeIreland}
                  onChange={(e) => update({ feeIreland: e.target.value })}
                  placeholder="Default from catalog"
                  disabled={disabled}
                />
              </div>
            </div>
          )}
          {listingId && isLiveListing && (
            <Button
              type="button"
              variant="outline"
              onClick={() => void openDeliveryPreviewModal()}
              disabled={disabled}
            >
              Preview delivery changes
            </Button>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <ExistingListingPhotos
            images={existingImages}
            sortable
            onReorder={onReorderExistingImages}
            onRemove={onRemoveExistingImage}
            removingId={removingExistingImageId}
            removeDisabled={disabled || reorderingImages}
            reordering={reorderingImages}
          />
          <div>
            <Label htmlFor="vehicle-photos">Add photos</Label>
            <Input
              id="vehicle-photos"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImagesChange}
              disabled={disabled || uploadAtCapacity}
            />
            <p className="mt-1 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
              Up to {MAX_LISTING_IMAGES} photos · 16:9 crop on upload · JPEG, PNG, or WebP
            </p>
            {photosNotice && (
              <p className="mt-1 text-xs text-amber-700">{photosNotice}</p>
            )}
          </div>
          <SelectedFilePreviews
            files={data.images}
            onRemove={removeSelectedImage}
          />
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4 rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] p-4 text-sm">
          <h3 className="font-semibold">{previewTitle || "Vehicle listing"}</h3>
          <dl className="grid gap-2 sm:grid-cols-2">
            {(attrs.yearText || attrs.year != null) && (
              <>
                <dt className="text-gray-500">Year</dt>
                <dd>{attrs.yearText ?? attrs.year}</dd>
              </>
            )}
            {attrs.make && (
              <>
                <dt className="text-gray-500">Make</dt>
                <dd>{attrs.make}</dd>
              </>
            )}
            {attrs.model && (
              <>
                <dt className="text-gray-500">Model</dt>
                <dd>{attrs.model}</dd>
              </>
            )}
            {attrs.mileage != null && (
              <>
                <dt className="text-gray-500">Mileage</dt>
                <dd>
                  {attrs.mileage.toLocaleString()} {attrs.mileageUnit ?? "km"}
                </dd>
              </>
            )}
            {attrs.fuelType && (
              <>
                <dt className="text-gray-500">Fuel</dt>
                <dd>{attrs.fuelType}</dd>
              </>
            )}
            {attrs.transmission && (
              <>
                <dt className="text-gray-500">Transmission</dt>
                <dd>{attrs.transmission}</dd>
              </>
            )}
          </dl>
          {data.salePrice && (
            <p className="text-lg font-bold">
              {formatCurrency(Number(data.salePrice), "EUR")}
            </p>
          )}
          {reviewDeliveryLabel && (
            <p className="text-gray-600">{reviewDeliveryLabel}</p>
          )}
          <p className="text-xs text-gray-500">
            Description preview: {buildVehicleDescription(data, attrs).slice(0, 120)}
            …
          </p>
        </div>
      )}

      <div className="mt-8 flex justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={step === 0 || disabled}
        >
          Back
        </Button>
        <Button type="button" onClick={handleNext} disabled={disabled}>
          {step === STEPS.length - 1 ? submitLabel : "Next"}
        </Button>
      </div>

      <DeliveryPreviewModal
        open={showDeliveryPreview}
        preview={deliveryPreview}
        loading={deliverySubmitting}
        onClose={() => setShowDeliveryPreview(false)}
        onConfirm={() => void confirmDeliveryUpdate()}
      />

      <PricingPreviewModal
        open={showPricingPreview}
        preview={pricingPreview}
        loading={pricingSubmitting}
        onClose={() => setShowPricingPreview(false)}
        onConfirm={() => void confirmPricingSave()}
      />
    </div>
  );
}
