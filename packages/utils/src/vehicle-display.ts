import type { ListingVehicleAttributes } from '@community-marketplace/types';

export function resolveVehicleYearDisplay(
  specs: ListingVehicleAttributes,
): string | undefined {
  if (specs.yearText?.trim()) return specs.yearText.trim();
  if (specs.year != null) return String(specs.year);
  return undefined;
}

export function resolveVehicleEngineSizeDisplay(
  specs: ListingVehicleAttributes,
): string | undefined {
  if (specs.engineSizeText?.trim()) return specs.engineSizeText.trim();
  if (specs.engineSize != null) {
    return `${specs.engineSize.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    })} L`;
  }
  return undefined;
}

export function resolveVehicleSeatsDisplay(
  specs: ListingVehicleAttributes,
): string | undefined {
  if (specs.seatsText?.trim()) return specs.seatsText.trim();
  if (specs.seats != null) return String(specs.seats);
  return undefined;
}

export function resolveVehicleDoorsDisplay(
  specs: ListingVehicleAttributes,
): string | undefined {
  if (specs.doorsText?.trim()) return specs.doorsText.trim();
  if (specs.doors != null) return String(specs.doors);
  return undefined;
}

export function resolveVehicleConditionDisplay(
  specs: ListingVehicleAttributes,
  fallbackCondition?: string,
): string | undefined {
  if (specs.conditionLabel?.trim()) return specs.conditionLabel.trim();
  if (specs.conditionSet && fallbackCondition) {
    return fallbackCondition.replace(/_/g, ' ');
  }
  return undefined;
}
