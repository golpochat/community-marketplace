import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp, { type OverlayOptions } from 'sharp';

export const runtime = 'nodejs';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const MAX_BYTES = 300 * 1024;

function brandAsset(...segments: string[]): string {
  return path.join(process.cwd(), 'public', 'brand', 'sellnearby', 'png', ...segments);
}

/** Gradient background only — no SVG text (Alpine Docker has no font files). */
function buildBackgroundSvg(): Buffer {
  const svg = `
    <svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0D9488"/>
          <stop offset="55%" stop-color="#0F766E"/>
          <stop offset="100%" stop-color="#115E59"/>
        </linearGradient>
        <radialGradient id="glow" cx="78%" cy="22%" r="50%">
          <stop offset="0%" stop-color="#5EEAD4" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#5EEAD4" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect width="100%" height="100%" fill="url(#glow)"/>
    </svg>`;
  return Buffer.from(svg);
}

async function encodeOgJpeg(layers: OverlayOptions[]): Promise<Buffer> {
  const background = await sharp(buildBackgroundSvg())
    .resize(OG_WIDTH, OG_HEIGHT)
    .png()
    .toBuffer();

  let quality = 88;
  let output = await sharp(background)
    .composite(layers)
    .jpeg({ quality, chromaSubsampling: '4:4:4' })
    .toBuffer();

  while (output.length > MAX_BYTES && quality > 50) {
    quality -= 8;
    output = await sharp(background)
      .composite(layers)
      .jpeg({ quality, chromaSubsampling: '4:4:4' })
      .toBuffer();
  }

  return output;
}

export async function GET() {
  try {
    const [logo, icon] = await Promise.all([
      readFile(brandAsset('logo-dark-mode-compact.png')),
      readFile(brandAsset('icon-app-rounded.png')),
    ]);

    const logoLayer = await sharp(logo)
      .resize(640, 168, { fit: 'inside' })
      .png()
      .toBuffer();
    const logoMeta = await sharp(logoLayer).metadata();

    const iconLayer = await sharp(icon).resize(200, 200).png().toBuffer();

    const logoTop = Math.round((OG_HEIGHT - (logoMeta.height ?? 168)) / 2);
    const iconTop = Math.round((OG_HEIGHT - 200) / 2);

    const output = await encodeOgJpeg([
      { input: logoLayer, top: logoTop, left: 72 },
      { input: iconLayer, top: iconTop, left: 900 },
    ]);

    return new Response(new Uint8Array(output), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(output.length),
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch {
    const fallback = await sharp(buildBackgroundSvg())
      .resize(OG_WIDTH, OG_HEIGHT)
      .jpeg({ quality: 85 })
      .toBuffer();

    return new Response(new Uint8Array(fallback), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(fallback.length),
        'Cache-Control': 'public, max-age=300',
      },
    });
  }
}
