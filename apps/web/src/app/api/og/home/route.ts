import { APP_NAME } from '@community-marketplace/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

export const runtime = 'nodejs';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const MAX_BYTES = 300 * 1024;

const TAGLINE = "Ireland's trusted community marketplace";
const SUBLINE = 'Buy and sell locally — no commission fees';

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

async function loadBrandIcon(): Promise<Buffer | null> {
  try {
    const iconPath = path.join(process.cwd(), 'public', 'brand', 'sellnearby', 'png', 'icon-app-rounded.png');
    return await readFile(iconPath);
  } catch {
    return null;
  }
}

function buildBrandSvg(): Buffer {
  const svg = `
    <svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0D9488"/>
          <stop offset="55%" style="stop-color:#0F766E"/>
          <stop offset="100%" style="stop-color:#115E59"/>
        </linearGradient>
        <radialGradient id="glow" cx="75%" cy="20%" r="55%">
          <stop offset="0%" style="stop-color:#5EEAD4;stop-opacity:0.35"/>
          <stop offset="100%" style="stop-color:#5EEAD4;stop-opacity:0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect width="100%" height="100%" fill="url(#glow)"/>
      <text x="80" y="300" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="72" font-weight="700">${APP_NAME}</text>
      <text x="80" y="380" fill="#CCFBF1" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="600">${TAGLINE}</text>
      <text x="80" y="450" fill="#99F6E4" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="500">${SUBLINE}</text>
    </svg>`;
  return Buffer.from(svg);
}

export async function GET() {
  const base = await compressToTarget(buildBrandSvg());
  const icon = await loadBrandIcon();

  let output = base;
  if (icon) {
    const resizedIcon = await sharp(icon).resize(220, 220).png().toBuffer();
    output = await sharp(base)
      .composite([{ input: resizedIcon, top: 155, left: 860 }])
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
  }

  return new Response(new Uint8Array(output), {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
    },
  });
}
