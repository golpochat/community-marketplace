import type { PlatformPurchaseType } from '@community-marketplace/types';

export interface PlatformPurchaseInvoiceData {
  invoiceNumber: string;
  purchaseId: string;
  issuedAt: string;
  currency: string;
  amount: number;
  purchaseType: PlatformPurchaseType;
  purchaseLabel: string;
  purchaseDescription: string;
  customerName: string;
  customerEmail: string;
  listingTitle?: string;
  providerReference?: string;
  webAppUrl: string;
}

export function buildPlatformInvoiceNumber(purchaseId: string, issuedAt: Date): string {
  const date = issuedAt.toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = purchaseId.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `SN-INV-${date}-${suffix}`;
}

export const PLATFORM_PURCHASE_LABELS: Record<PlatformPurchaseType, string> = {
  listing_boost: 'Listing boost',
  featured_slot: 'Featured listing',
  fast_track_verification: 'Fast-track verification',
  store_slot_2: 'Additional store slot',
  store_slot_3: 'Additional store slot (bundle)',
  store_bundle_3: 'Store slot bundle',
  buyer_statement: 'Purchase history statement',
};

export function describePlatformPurchase(
  type: PlatformPurchaseType,
  metadata: Record<string, unknown>,
  listingTitle?: string,
): string {
  switch (type) {
    case 'listing_boost':
      return listingTitle
        ? `Boost for "${listingTitle}" (${String(metadata.packageType ?? 'package')})`
        : 'Listing boost package';
    case 'featured_slot': {
      const placement = metadata.placement === 'category' ? 'category' : 'homepage';
      return listingTitle
        ? `Featured placement (${placement}) for "${listingTitle}"`
        : `Featured placement (${placement})`;
    }
    case 'fast_track_verification':
      return 'Priority seller verification review';
    case 'store_slot_2':
      return 'Unlock an additional store slot';
    case 'store_slot_3':
      return 'Unlock additional store slots';
    case 'store_bundle_3':
      return 'Store slot bundle (3 slots)';
    case 'buyer_statement': {
      const year = metadata.year;
      const month = metadata.month;
      if (year && month) {
        return `Purchase history statement (${year}-${String(month).padStart(2, '0')})`;
      }
      return 'Purchase history statement';
    }
    default:
      return PLATFORM_PURCHASE_LABELS[type];
  }
}

export { formatReceiptDate, formatReceiptMoney } from '../../payments/lib/payment-receipt.types';
