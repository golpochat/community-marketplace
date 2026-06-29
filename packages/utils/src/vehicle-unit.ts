import type { ListingVehicleAttributes } from '@community-marketplace/types';

export function buildVehicleListingTitle(
  year?: number | string,
  make?: string,
  model?: string,
): string {
  const yearPart =
    year != null && String(year).trim() !== '' ? String(year).trim() : '';
  const parts = [yearPart, make?.trim() ?? '', model?.trim() ?? ''].filter(Boolean);
  return parts.join(' ').trim();
}

export function parseVehicleAttributes(
  value: unknown,
): ListingVehicleAttributes | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as ListingVehicleAttributes;
}

export function normalizeVehicleVin(vin?: string | null): string | undefined {
  const normalized = vin?.trim().toUpperCase().replace(/\s+/g, '');
  if (!normalized || normalized.length < 11) return undefined;
  return normalized;
}

export function formatVehicleMileageLabel(
  mileage?: number,
  unit?: 'km' | 'mi',
): string | undefined {
  if (mileage == null || Number.isNaN(mileage)) return undefined;
  return `${mileage.toLocaleString('en-IE')} ${unit ?? 'km'}`;
}

/** Short suffix so similar models are easy to tell apart in search and storefront grids. */
export function buildVehicleUnitSuffix(
  attrs?: Pick<ListingVehicleAttributes, 'mileage' | 'mileageUnit' | 'color' | 'chassis'>,
): string | undefined {
  if (!attrs) return undefined;
  const parts: string[] = [];
  const mileage = formatVehicleMileageLabel(attrs.mileage, attrs.mileageUnit);
  if (mileage) parts.push(mileage);
  if (attrs.color?.trim()) parts.push(attrs.color.trim());
  if (!parts.length && attrs.chassis?.trim()) {
    parts.push(attrs.chassis.trim());
  }
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

export function stripVehicleTitleSuffix(title: string): string {
  const trimmed = title.trim();
  const dashIndex = trimmed.indexOf(' — ');
  return dashIndex > 0 ? trimmed.slice(0, dashIndex).trim() : trimmed;
}

export function buildVehicleDisplayTitle(
  year?: number | string,
  make?: string,
  model?: string,
  attrs?: Pick<
    ListingVehicleAttributes,
    'mileage' | 'mileageUnit' | 'color' | 'chassis' | 'year' | 'yearText' | 'make' | 'model'
  >,
): string {
  const yearValue = year ?? attrs?.year ?? attrs?.yearText;
  const base =
    buildVehicleListingTitle(yearValue, make ?? attrs?.make, model ?? attrs?.model) ||
    [attrs?.yearText, attrs?.make, attrs?.model].filter(Boolean).join(' ').trim();
  const suffix = buildVehicleUnitSuffix(attrs);
  if (!base) return suffix ?? '';
  if (!suffix) return base;
  if (base.includes(suffix)) return base;
  return `${base} — ${suffix}`;
}

export function vehicleUnitsLikelyMatch(
  left?: ListingVehicleAttributes,
  right?: ListingVehicleAttributes,
): boolean {
  const leftVin = normalizeVehicleVin(left?.vin);
  const rightVin = normalizeVehicleVin(right?.vin);
  if (leftVin && rightVin) return leftVin === rightVin;

  const leftChassis = left?.chassis?.trim().toUpperCase();
  const rightChassis = right?.chassis?.trim().toUpperCase();
  if (leftChassis && rightChassis && leftChassis === rightChassis) {
    if (left?.mileage != null && right?.mileage != null) {
      return left.mileage === right.mileage;
    }
    return true;
  }

  const leftHasUnit = Boolean(leftVin || leftChassis || left?.mileage != null || left?.color?.trim());
  const rightHasUnit = Boolean(rightVin || rightChassis || right?.mileage != null || right?.color?.trim());
  return !leftHasUnit && !rightHasUnit;
}

export function normalizeVehicleAttributesForSave(
  attributes: unknown,
): Record<string, unknown> | undefined {
  const attrs = parseVehicleAttributes(attributes);
  if (!attrs) {
    return attributes && typeof attributes === 'object' && !Array.isArray(attributes)
      ? (attributes as Record<string, unknown>)
      : undefined;
  }
  const vin = normalizeVehicleVin(attrs.vin);
  const next: ListingVehicleAttributes = { ...attrs };
  if (vin) {
    next.vin = vin;
  } else {
    delete next.vin;
  }
  return next as Record<string, unknown>;
}

export function stripVehicleUnitIdentity(
  attributes: unknown,
): Record<string, unknown> | undefined {
  const attrs = parseVehicleAttributes(attributes);
  if (!attrs) return undefined;
  const next = { ...attrs };
  delete next.vin;
  delete next.chassis;
  return next as Record<string, unknown>;
}
