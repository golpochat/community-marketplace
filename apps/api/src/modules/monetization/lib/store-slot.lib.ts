import type { PlatformPurchaseType } from '@community-marketplace/types';
import { STORE_PLATFORM_MAX } from '@community-marketplace/types';

export type StoreSlotSku = Extract<
  PlatformPurchaseType,
  'store_slot_2' | 'store_slot_3' | 'store_bundle_3'
>;

export const STORE_SLOT_SKUS: StoreSlotSku[] = [
  'store_slot_2',
  'store_slot_3',
  'store_bundle_3',
];

export function isStoreSlotSku(value: string): value is StoreSlotSku {
  return STORE_SLOT_SKUS.includes(value as StoreSlotSku);
}

export function storeSlotSkuConfigKey(sku: StoreSlotSku): StoreSlotSku {
  return sku;
}

export function targetStoreSlotLimit(sku: StoreSlotSku): number {
  switch (sku) {
    case 'store_slot_2':
      return 2;
    case 'store_slot_3':
    case 'store_bundle_3':
      return 3;
    default:
      return 1;
  }
}

export function slotsGrantedBySku(sku: StoreSlotSku, currentLimit: number): number {
  const target = targetStoreSlotLimit(sku);
  return Math.max(0, Math.min(target, STORE_PLATFORM_MAX) - currentLimit);
}

export function storeSlotLabel(sku: StoreSlotSku): string {
  switch (sku) {
    case 'store_slot_2':
      return '2nd storefront';
    case 'store_slot_3':
      return '3rd storefront';
    case 'store_bundle_3':
      return '3-store bundle';
    default:
      return sku;
  }
}
