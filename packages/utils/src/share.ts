import type { ListingDeliverySelection } from '@community-marketplace/types';

const DEFAULT_MARKETPLACE_NAME = 'Community Marketplace';

function formatEuro(amount: number): string {
  return `€${amount.toFixed(amount % 1 === 0 ? 0 : 2)}`;
}

function deliveryLine(options?: ListingDeliverySelection[], locationLabel?: string): string {
  if (!options?.length) return '';

  const zones = options.map((o) => o.zone).filter(Boolean);
  if (zones.length === 0) return '';

  const onlyCollection = zones.every((z) => z === 'COLLECTION');
  if (onlyCollection) return 'Collection only.';
  const location = locationLabel?.trim();
  return location ? `Delivery available in ${location}.` : 'Delivery available.';
}

export interface ShareTextInput {
  title: string;
  price: number;
  salePrice?: number;
  originalPrice?: number;
  currency?: string;
  location?: { label: string };
  deliveryOptions?: ListingDeliverySelection[];
}

export function generateShareText(
  listing: ShareTextInput,
  shortUrl: string,
  marketplaceName: string = DEFAULT_MARKETPLACE_NAME,
): string {
  const finalPrice = listing.salePrice ?? listing.price;
  const hasSale =
    listing.originalPrice != null &&
    listing.salePrice != null &&
    listing.salePrice < listing.originalPrice;

  let priceLine = `${listing.title} – ${formatEuro(finalPrice)}`;
  if (hasSale && listing.originalPrice != null) {
    priceLine = `${listing.title} – ${formatEuro(finalPrice)} (was ${formatEuro(listing.originalPrice)})`;
  }

  const delivery = deliveryLine(listing.deliveryOptions, listing.location?.label);
  const lines = [
    `Check out this item on ${marketplaceName}:`,
    priceLine,
    delivery,
    shortUrl,
  ].filter((line) => line.length > 0);

  return lines.join('\n');
}

const SHORT_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

export function generateShortCode(length = 7): string {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += SHORT_CODE_CHARS[Math.floor(Math.random() * SHORT_CODE_CHARS.length)];
  }
  return code;
}

export function getShortLinkUrl(shortCode: string, appUrl: string): string {
  const base = appUrl.replace(/\/$/, '');
  return `${base}/l/${shortCode}`;
}
