import type { DeliveryOption, ListingDeliverySelection } from '@community-marketplace/types';

export type VehicleDeliveryMode = 'collection' | 'delivery' | 'both' | 'custom';

export const VEHICLE_DELIVERY_PRESETS: Array<{
  value: Exclude<VehicleDeliveryMode, 'custom'>;
  label: string;
}> = [
  { value: 'collection', label: 'Collection only' },
  { value: 'delivery', label: 'Delivery available' },
  { value: 'both', label: 'Delivery & collection' },
];

export function inferVehicleDeliveryMode(
  selections: ListingDeliverySelection[],
): VehicleDeliveryMode {
  const zones = new Set(selections.map((s) => s.zone));
  const customOnly =
    zones.size === 1 &&
    zones.has('CUSTOM') &&
    selections.some((s) => s.customLabel?.trim());
  if (customOnly) return 'custom';

  const hasCollection = zones.has('COLLECTION');
  const hasDelivery = zones.has('LOCAL') || zones.has('NATIONAL') || zones.has('CUSTOM');
  if (hasCollection && hasDelivery) return 'both';
  if (hasDelivery) return 'delivery';
  return 'collection';
}

export function vehicleDeliveryFeesFromSelections(
  selections: ListingDeliverySelection[],
): { dublin: string; ireland: string; customLabel: string } {
  const local = selections.find((s) => s.zone === 'LOCAL');
  const national = selections.find((s) => s.zone === 'NATIONAL');
  const custom = selections.find((s) => s.zone === 'CUSTOM');
  return {
    dublin: local?.customPrice != null ? String(local.customPrice) : '',
    ireland: national?.customPrice != null ? String(national.customPrice) : '',
    customLabel: custom?.customLabel?.trim() ?? custom?.label?.trim() ?? '',
  };
}

export function buildVehicleDeliverySelections(
  catalog: DeliveryOption[],
  mode: VehicleDeliveryMode,
  feeDublin?: string,
  feeIreland?: string,
  customDeliveryLabel?: string,
): ListingDeliverySelection[] {
  const collection = catalog.find((o) => o.zone === 'COLLECTION');
  const local = catalog.find((o) => o.zone === 'LOCAL');
  const national = catalog.find((o) => o.zone === 'NATIONAL');
  const customOption = catalog.find((o) => o.zone === 'CUSTOM');
  const selections: ListingDeliverySelection[] = [];

  if (mode === 'custom' && customOption) {
    const label = customDeliveryLabel?.trim();
    if (label) {
      selections.push({
        deliveryOptionId: customOption.id,
        customLabel: label,
        label,
        zone: 'CUSTOM',
        price: 0,
        customPrice: 0,
      });
    }
    return selections;
  }

  if ((mode === 'collection' || mode === 'both') && collection) {
    selections.push({
      deliveryOptionId: collection.id,
      label: collection.label,
      zone: 'COLLECTION',
      price: collection.defaultPrice ?? 0,
    });
  }

  if (mode === 'delivery' || mode === 'both') {
    if (local) {
      const customPrice = feeDublin?.trim() ? Number(feeDublin) : undefined;
      selections.push({
        deliveryOptionId: local.id,
        label: local.label,
        zone: 'LOCAL',
        price: customPrice ?? local.defaultPrice ?? 0,
        ...(customPrice != null && !Number.isNaN(customPrice)
          ? { customPrice }
          : {}),
      });
    }
    if (national) {
      const customPrice = feeIreland?.trim() ? Number(feeIreland) : undefined;
      selections.push({
        deliveryOptionId: national.id,
        label: national.label,
        zone: 'NATIONAL',
        price: customPrice ?? national.defaultPrice ?? 0,
        ...(customPrice != null && !Number.isNaN(customPrice)
          ? { customPrice }
          : {}),
      });
    }
  }

  if (selections.length === 0 && collection) {
    selections.push({
      deliveryOptionId: collection.id,
      label: collection.label,
      zone: 'COLLECTION',
      price: collection.defaultPrice ?? 0,
    });
  }

  return selections;
}
