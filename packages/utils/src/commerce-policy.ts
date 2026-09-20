import type { SaleCloseChannelKpi, SellerPlatformFeeInfo } from '@community-marketplace/types';

export const LISTING_SALE_CLOSE_CHANNELS = [
  'card_on_platform',
  'cash_collection',
  'off_platform',
  'other',
] as const;

export type ListingSaleCloseChannel = (typeof LISTING_SALE_CLOSE_CHANNELS)[number];

export const LISTING_SALE_CLOSE_CHANNEL_LABELS: Record<ListingSaleCloseChannel, string> = {
  card_on_platform: 'Paid on SellNearby (card)',
  cash_collection: 'Cash or collection (not card checkout)',
  off_platform: 'Sold on another site or off-platform',
  other: 'Other',
};

export function isListingSaleCloseChannel(
  value: string,
): value is ListingSaleCloseChannel {
  return (LISTING_SALE_CLOSE_CHANNELS as readonly string[]).includes(value);
}

export function resolveSellerPlatformFee(input: {
  sellerStatus?: string | null;
  customPlatformFeePercent?: number | null;
  defaultPlatformFeePercent: number;
  verifiedSellerFeePercent: number;
}): SellerPlatformFeeInfo {
  const defaultFeePercent = input.defaultPlatformFeePercent;
  const verifiedSellerFeePercent = input.verifiedSellerFeePercent;
  const isVerified = input.sellerStatus === 'verified';
  const policyPercent = isVerified ? verifiedSellerFeePercent : defaultFeePercent;
  const hasCustom = input.customPlatformFeePercent != null;
  const custom = hasCustom ? Number(input.customPlatformFeePercent) : null;

  if (hasCustom && custom != null && custom !== policyPercent) {
    return {
      effectiveFeePercent: custom,
      isCustomOverride: true,
      defaultFeePercent,
      verifiedSellerFeePercent,
      isVerifiedRate: false,
    };
  }

  return {
    effectiveFeePercent: policyPercent,
    isCustomOverride: false,
    defaultFeePercent,
    verifiedSellerFeePercent,
    isVerifiedRate: isVerified,
  };
}

export function formatSellerFeeDisclosure(info: SellerPlatformFeeInfo): string {
  const rate = info.effectiveFeePercent;
  const verified = info.verifiedSellerFeePercent ?? rate;
  if (info.isCustomOverride) {
    return `Your seller service fee is ${rate}% on card checkout (custom rate). Cash or collection arranged in chat has no seller service fee. Buyers pay the listed price.`;
  }
  if (info.isVerifiedRate) {
    return `Your seller service fee is ${rate}% on card checkout (verified rate). Cash or collection arranged in chat has no seller service fee. Buyers pay the listed price.`;
  }
  return `Your seller service fee is ${rate}% on card checkout. Verified sellers pay ${verified}%. Cash or collection arranged in chat has no seller service fee. Buyers pay the listed price.`;
}

export const COMMERCE_PUBLIC_COPY = {
  browseDescription:
    'Discover items from trusted local sellers across Ireland on SellNearby — free to list, optional card checkout.',
  heroBody:
    'Discover local listings, message sellers safely, and keep trade in your neighbourhood. Listing is free. Card checkout is optional — sellers pay a service fee only when a buyer pays by card.',
  ogDescription:
    "Ireland's trusted community marketplace. Free to list and message. Optional card checkout with seller payouts — no listing fee.",
  llmsTagline:
    "Ireland's community marketplace — buy and sell locally. Free to list; seller service fee on card payouts only.",
  aboutMeta:
    "Learn about SellNearby — Ireland's community marketplace for buying and selling locally. Free to list; optional card checkout.",
  trustCueCompact: 'Verified sellers · secure messaging · card checkout with a receipt',
  trustCueTitle: 'Safer card checkout',
  trustCueBody:
    'Pay by card for a receipt and a 48-hour dispute review. Cash or collection arranged in chat is at your own risk. SellNearby is not an escrow service.',
  heroBadgeCard: 'Card checkout & receipts',
  chatPayHint: 'Pay on SellNearby for a receipt. Cash collection stays available in chat.',
  disputeReview:
    'Card checkout disputes are reviewed within 48 hours. Cash or collection arranged in chat is at your own risk. SellNearby is not an escrow service.',
  legalDraftNotice:
    'This page is a solicitor-ready draft for the Ireland pilot. It has not been signed off by a solicitor yet.',
} as const;

/** Show Stripe Connect payout setup when a listing is at or above this listed price. */
export const CONNECT_NUDGE_MIN_LISTING_PRICE_EUR = 50;

export function shouldNudgeSellerConnect(listingPriceEur: number): boolean {
  return Number.isFinite(listingPriceEur) && listingPriceEur >= CONNECT_NUDGE_MIN_LISTING_PRICE_EUR;
}

/** Rolling window for the Friday card vs chat/cash close mix. */
export const SALE_CLOSE_KPI_WINDOW_DAYS = 7;

export type SaleCloseKpiBucket = 'card' | 'leaked' | 'unknown';

export function classifySaleCloseChannel(value: unknown): SaleCloseKpiBucket {
  if (value === 'card_on_platform') return 'card';
  if (typeof value === 'string' && isListingSaleCloseChannel(value)) return 'leaked';
  return 'unknown';
}

export function emptySaleCloseChannelKpi(
  windowDays = SALE_CLOSE_KPI_WINDOW_DAYS,
): SaleCloseChannelKpi {
  return {
    windowDays,
    soldCount: 0,
    cardCount: 0,
    cardListedGmv: 0,
    leakedCount: 0,
    leakedListedGmv: 0,
    unknownCount: 0,
    leakRate: 0,
  };
}

export function summarizeSaleCloseEvents(
  events: ReadonlyArray<{ closeChannel?: unknown; listedPrice: number }>,
  windowDays = SALE_CLOSE_KPI_WINDOW_DAYS,
): SaleCloseChannelKpi {
  const kpi = emptySaleCloseChannelKpi(windowDays);
  for (const event of events) {
    const listedPrice = Number.isFinite(event.listedPrice) ? event.listedPrice : 0;
    kpi.soldCount += 1;
    const bucket = classifySaleCloseChannel(event.closeChannel);
    if (bucket === 'card') {
      kpi.cardCount += 1;
      kpi.cardListedGmv += listedPrice;
    } else if (bucket === 'leaked') {
      kpi.leakedCount += 1;
      kpi.leakedListedGmv += listedPrice;
    } else {
      kpi.unknownCount += 1;
    }
  }
  const classified = kpi.cardCount + kpi.leakedCount;
  kpi.leakRate = classified > 0 ? kpi.leakedCount / classified : 0;
  return kpi;
}

export function buildLocationBrowseDescription(
  place: string,
  county: string,
  appName: string,
): string {
  return `Browse second-hand items in ${place}, ${county}. Free to list; cash collection has no seller service fee — furniture, electronics, and more on ${appName}.`;
}

/** User-facing product copy must not claim a commission-free marketplace. */
export const FORBIDDEN_PUBLIC_CLAIM_PATTERNS: readonly RegExp[] = [
  /\bno commission\b/i,
  /without commission/i,
  /without platform commission/i,
];
