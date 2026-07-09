import { APP_NAME } from '@community-marketplace/config';
import { computeListingPricing } from '@community-marketplace/utils';
import sharp from 'sharp';

import { fetchListingById, listingCacheTag } from '@/lib/server-listings';
import { pickBestListingOgImage } from '@/lib/listing-og-image-pick';

export const runtime = 'nodejs';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const MAX_BYTES = 300 * 1024;

async function compressToTarget(input: Buffer): Promise<Buffer> {
  let quality = 85;
  let buffer = await sharp(input)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'centre' })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  while (buffer.length > MAX_BYTES && quality > 45) {
    quality -= 10;
    buffer = await sharp(input)
      .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'centre' })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }

  return buffer;
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function buildPlaceholder(
  title: string,
  priceLabel: string,
  saleLabel?: string,
): Promise<Buffer> {
  const escapedTitle = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const saleBadge = saleLabel
    ? `<rect x="60" y="200" width="220" height="56" rx="8" fill="#dc2626"/>
      <text x="80" y="238" fill="#ffffff" font-family="Arial, sans-serif" font-size="28" font-weight="700">${saleLabel}</text>`
    : '';
  const svg = `
    <svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1e40af"/>
          <stop offset="100%" style="stop-color:#2563eb"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <text x="60" y="120" fill="#ffffff" font-family="Arial, sans-serif" font-size="28" font-weight="600">${APP_NAME}</text>
      ${saleBadge}
      <text x="60" y="320" fill="#ffffff" font-family="Arial, sans-serif" font-size="52" font-weight="700">${escapedTitle.slice(0, 60)}</text>
      <text x="60" y="400" fill="#dbeafe" font-family="Arial, sans-serif" font-size="40" font-weight="600">${priceLabel}</text>
    </svg>`;

  return compressToTarget(Buffer.from(svg));
}

function saleOverlaySvg(badgeLabel: string, originalLabel: string, saleLabel: string): Buffer {
  const svg = `
    <svg width="${OG_WIDTH}" height="96" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="96" fill="rgba(15,23,42,0.72)"/>
      <rect x="32" y="20" width="148" height="44" rx="8" fill="#dc2626"/>
      <text x="48" y="50" fill="#ffffff" font-family="Arial, sans-serif" font-size="24" font-weight="700">${badgeLabel}</text>
      <text x="200" y="44" fill="#d1d5db" font-family="Arial, sans-serif" font-size="26" text-decoration="line-through">${originalLabel}</text>
      <text x="200" y="76" fill="#ffffff" font-family="Arial, sans-serif" font-size="32" font-weight="700">${saleLabel}</text>
    </svg>`;
  return Buffer.from(svg);
}

async function applySaleOverlay(
  input: Buffer,
  badgeLabel: string,
  originalLabel: string,
  saleLabel: string,
): Promise<Buffer> {
  const overlay = saleOverlaySvg(badgeLabel, originalLabel, saleLabel);
  return sharp(input)
    .composite([{ input: overlay, top: OG_HEIGHT - 96, left: 0 }])
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const listing = await fetchListingById(id);

  if (!listing || listing.status !== 'active') {
    return new Response('Not found', { status: 404 });
  }

  const price = listing.salePrice ?? listing.price;
  const priceLabel = `€${price.toFixed(price % 1 === 0 ? 0 : 2)}`;

  let pricingMeta: ReturnType<typeof computeListingPricing> | null = null;
  try {
    pricingMeta = computeListingPricing({
      salePrice: listing.salePrice ?? listing.price,
      originalPrice: listing.originalPrice,
      price: listing.price,
    });
  } catch {
    pricingMeta = null;
  }

  const hasSale = pricingMeta?.hasSaleBadge ?? false;
  const originalLabel =
    pricingMeta?.originalPrice != null
      ? `€${pricingMeta.originalPrice.toFixed(pricingMeta.originalPrice % 1 === 0 ? 0 : 2)}`
      : '';
  const saleLabel = hasSale ? priceLabel : undefined;
  const badgeLabel = pricingMeta?.badgeLabel ?? 'SALE';

  let output: Buffer;
  const bestImage = await pickBestListingOgImage(listing.images, fetchImageBuffer);

  if (bestImage) {
    let composed = await compressToTarget(bestImage.buffer);
    if (hasSale && originalLabel) {
      composed = await applySaleOverlay(composed, badgeLabel, originalLabel, priceLabel);
    }
    output = composed;
  } else {
    output = await buildPlaceholder(listing.title, priceLabel, hasSale ? badgeLabel : undefined);
  }

  return new Response(new Uint8Array(output), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
      'X-Cache-Tag': listingCacheTag(id),
    },
  });
}
