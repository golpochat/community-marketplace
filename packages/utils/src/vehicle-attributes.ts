import type { ListingVehicleAttributes } from '@community-marketplace/types';

export function hasVehicleAttributeValue(value: unknown): boolean {
  if (value === null || value === undefined || value === '') return false;
  if (typeof value === 'number' && Number.isNaN(value)) return false;
  return true;
}

export function compactVehicleAttributes(
  attrs: ListingVehicleAttributes,
): ListingVehicleAttributes {
  const out: ListingVehicleAttributes = {};
  for (const [key, value] of Object.entries(attrs) as Array<
    [keyof ListingVehicleAttributes, ListingVehicleAttributes[keyof ListingVehicleAttributes]]
  >) {
    if (hasVehicleAttributeValue(value)) {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}

export function formatEngineSizeLitres(size?: number): string | undefined {
  if (size == null) return undefined;
  return `${size.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} L`;
}

export function formatVehicleDate(iso?: string): string | undefined {
  if (!iso?.trim()) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
