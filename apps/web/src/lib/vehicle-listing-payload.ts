import type {
  Listing,
  ListingCondition,
  ListingDeliverySelection,
  ListingVehicleAttributes,
} from '@community-marketplace/types';
import { stripEmptyVehicleAttributes } from '@community-marketplace/validation';

import { buildVehicleDisplayTitle } from '@community-marketplace/utils';

import type { VehicleFormData } from '@/components/seller/vehicle-listing-form';
import {
  VEHICLE_CONDITION_OPTIONS,
  buildVehicleListingTitle,
} from '@/lib/vehicle-catalog';

function parseOptionalInt(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : Math.trunc(parsed);
}

function parseOptionalFloat(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function resolveConditionPayload(data: VehicleFormData): {
  condition: ListingCondition;
  conditionLabel?: string;
  conditionSet?: boolean;
} {
  const custom = data.customCondition.trim();
  if (custom) {
    return { condition: 'good', conditionLabel: custom };
  }
  if (data.condition) {
    const label = VEHICLE_CONDITION_OPTIONS.find((o) => o.value === data.condition)?.label;
    return {
      condition: data.condition,
      conditionLabel: label,
      conditionSet: true,
    };
  }
  return { condition: 'good' };
}

export function vehicleAttributesFromForm(
  data: VehicleFormData,
): ListingVehicleAttributes {
  const yearParsed = parseOptionalInt(data.year);
  const mileage = parseOptionalFloat(data.mileage);
  const engineParsed = parseOptionalFloat(data.engineSize);
  const seatsParsed = parseOptionalInt(data.seats);
  const doorsParsed = parseOptionalInt(data.doors);
  const owners = parseOptionalInt(data.owners);

  const fuel = data.fuelType.trim();
  const isHybrid =
    fuel.toLowerCase().includes('hybrid') || fuel.toLowerCase().includes('electric');

  const conditionPayload = resolveConditionPayload(data);

  const raw: ListingVehicleAttributes = {
    make: data.make.trim() || undefined,
    model: data.model.trim() || undefined,
    year: yearParsed,
    yearText: !yearParsed && data.year.trim() ? data.year.trim() : undefined,
    bodyType: data.bodyType.trim() || undefined,
    color: data.color.trim() || undefined,
    engineSize: engineParsed,
    engineSizeText:
      !engineParsed && data.engineSize.trim() ? data.engineSize.trim() : undefined,
    fuelType: fuel || undefined,
    transmission: data.transmission.trim() || undefined,
    mileage,
    mileageUnit: mileage != null ? data.mileageUnit : undefined,
    chassis: data.chassis.trim() || undefined,
    seats: seatsParsed,
    seatsText: !seatsParsed && data.seats.trim() ? data.seats.trim() : undefined,
    doors: doorsParsed,
    doorsText: !doorsParsed && data.doors.trim() ? data.doors.trim() : undefined,
    vin: data.vin.trim() || undefined,
    nctExpiry: data.nctExpiry.trim() || undefined,
    roadTaxExpiry: data.roadTaxExpiry.trim() || undefined,
    owners,
    auctionGrade: data.auctionGrade.trim() || undefined,
    isHybrid: isHybrid || undefined,
    conditionLabel: conditionPayload.conditionLabel,
    conditionSet: conditionPayload.conditionSet,
  };

  return stripEmptyVehicleAttributes(
    raw as Record<string, unknown>,
  ) as ListingVehicleAttributes;
}

export function resolveListingCondition(
  data: VehicleFormData,
): ListingCondition {
  return resolveConditionPayload(data).condition;
}

export function buildVehicleDescription(
  data: VehicleFormData,
  attrs: ListingVehicleAttributes,
): string {
  const notes = data.sellerNotes.trim();
  if (notes.length >= 10) return notes;

  const yearDisplay = attrs.yearText ?? (attrs.year != null ? String(attrs.year) : '');
  const parts = [
    buildVehicleListingTitle(yearDisplay, attrs.make, attrs.model),
    attrs.mileage != null
      ? `${attrs.mileage.toLocaleString()} ${attrs.mileageUnit ?? 'km'}`
      : '',
    attrs.fuelType,
    attrs.transmission,
    attrs.bodyType,
    notes,
  ].filter(Boolean);

  const joined = parts.join(' · ');
  if (joined.length >= 10) return joined;
  return `${joined || 'Vehicle listing'}. Contact the seller for details.`;
}

export function buildVehicleListingCreatePayload(
  data: VehicleFormData,
  categoryId: string,
  deliverySelections: ListingDeliverySelection[],
) {
  const attrs = vehicleAttributesFromForm(data);
  const salePrice = Number(data.salePrice);
  const originalPrice = data.originalPrice.trim()
    ? Number(data.originalPrice)
    : undefined;
  const yearForTitle = attrs.year ?? (attrs.yearText ? Number(attrs.yearText) : undefined);
  const baseTitle =
    buildVehicleListingTitle(yearForTitle, attrs.make, attrs.model) ||
    [attrs.yearText, attrs.make, attrs.model].filter(Boolean).join(' ');

  return {
    title: buildVehicleDisplayTitle(yearForTitle, attrs.make, attrs.model, attrs) || baseTitle,
    description: buildVehicleDescription(data, attrs),
    price: salePrice,
    salePrice,
    originalPrice: originalPrice ?? null,
    currency: 'EUR' as const,
    categoryId,
    condition: resolveListingCondition(data),
    location: {
      label: data.location.trim() || 'Ireland',
      latitude: 53.3498,
      longitude: -6.2603,
    },
    deliverySelections: deliverySelections.map((s) => ({
      deliveryOptionId: s.deliveryOptionId,
      customLabel: s.customLabel,
      customPrice: s.customPrice,
    })),
    attributes: attrs,
    status: 'draft' as const,
    reserveWindowHours: data.reserveWindowHours,
    ...(data.storeId ? { storeId: data.storeId } : {}),
  };
}

export function buildVehicleListingUpdatePayload(
  data: VehicleFormData,
  categoryId: string,
  deliverySelections: ListingDeliverySelection[],
  includeDelivery: boolean,
  includePricing: boolean,
  includeTitle = true,
) {
  const payload = buildVehicleListingCreatePayload(
    data,
    categoryId,
    deliverySelections,
  );
  const { status: _status, ...rest } = payload;
  const result: Record<string, unknown> = { ...rest };
  if (!includeDelivery) {
    delete result.deliverySelections;
  }
  if (!includePricing) {
    delete result.price;
    delete result.salePrice;
    delete result.originalPrice;
  }
  if (!includeTitle) {
    delete result.title;
  }
  return result;
}

export function vehicleFormDataFromListing(
  listing: Listing,
  pricing: { salePrice: string; originalPrice: string },
): Partial<VehicleFormData> {
  const attrs = listing.attributes ?? {};
  const yearValue =
    attrs.year != null ? String(attrs.year) : (attrs.yearText ?? '');

  let condition: VehicleFormData['condition'] = '';
  let customCondition = '';
  if (attrs.conditionLabel?.trim()) {
    const matched = VEHICLE_CONDITION_OPTIONS.find(
      (o) => o.label === attrs.conditionLabel,
    );
    if (matched && attrs.conditionSet) {
      condition = matched.value;
    } else {
      customCondition = attrs.conditionLabel;
    }
  } else if (attrs.conditionSet && listing.condition) {
    condition = listing.condition;
  }

  return {
    categoryId: listing.categoryId,
    location: listing.location.label,
    make: attrs.make ?? '',
    model: attrs.model ?? '',
    year: yearValue,
    bodyType: attrs.bodyType ?? '',
    color: attrs.color ?? '',
    engineSize:
      attrs.engineSize != null
        ? String(attrs.engineSize)
        : (attrs.engineSizeText ?? ''),
    fuelType: attrs.fuelType ?? '',
    transmission: attrs.transmission ?? '',
    mileage: attrs.mileage != null ? String(attrs.mileage) : '',
    mileageUnit: attrs.mileageUnit ?? 'km',
    chassis: attrs.chassis ?? '',
    seats:
      attrs.seats != null ? String(attrs.seats) : (attrs.seatsText ?? ''),
    doors:
      attrs.doors != null ? String(attrs.doors) : (attrs.doorsText ?? ''),
    vin: attrs.vin ?? '',
    nctExpiry: attrs.nctExpiry ?? '',
    roadTaxExpiry: attrs.roadTaxExpiry ?? '',
    owners: attrs.owners != null ? String(attrs.owners) : '',
    auctionGrade: attrs.auctionGrade ?? '',
    condition,
    customCondition,
    sellerNotes: listing.description,
    salePrice: pricing.salePrice,
    originalPrice: pricing.originalPrice,
    reserveWindowHours:
      listing.reserveWindowHours === 4 ||
      listing.reserveWindowHours === 12 ||
      listing.reserveWindowHours === 24
        ? listing.reserveWindowHours
        : 12,
    images: [],
  };
}
