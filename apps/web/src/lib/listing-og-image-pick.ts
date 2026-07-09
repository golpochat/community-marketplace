import type { ListingImage } from '@community-marketplace/types';
import sharp from 'sharp';

const SAMPLE_SIZE = 160;

/** Higher score = more real product pixels, fewer blank banners / UI chrome. */
export async function scoreOgImageCandidate(buffer: Buffer): Promise<number> {
  const { data } = await sharp(buffer)
    .resize(SAMPLE_SIZE, SAMPLE_SIZE, { fit: 'cover', position: 'centre' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let score = 0;
  for (let i = 0; i < data.length; i += 3) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    if (r > 238 && g > 238 && b > 238) continue;
    if (r > 205 && g > 205 && b > 205 && Math.abs(r - g) < 12 && Math.abs(g - b) < 12) {
      score += 0.2;
      continue;
    }
    score += 1;
  }
  return score;
}

export async function pickBestListingOgImage(
  images: ListingImage[],
  fetchBuffer: (url: string) => Promise<Buffer | null>,
): Promise<{ buffer: Buffer; url: string } | null> {
  if (images.length === 0) return null;

  let best: { buffer: Buffer; url: string; score: number } | null = null;

  for (const image of images) {
    const url = image.url?.trim();
    if (!url) continue;

    const buffer = await fetchBuffer(url);
    if (!buffer) continue;

    const score = await scoreOgImageCandidate(buffer);
    if (!best || score > best.score) {
      best = { buffer, url, score };
    }
  }

  return best ? { buffer: best.buffer, url: best.url } : null;
}
