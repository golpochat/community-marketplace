import { getAppUrl } from '@/lib/site-url';
import sharp, { type OverlayOptions } from 'sharp';

export const runtime = 'nodejs';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const MAX_BYTES = 300 * 1024;

const LOGO_PATH = '/brand/sellnearby/png/logo-dark-mode-compact.png';
const ICON_PATH = '/brand/sellnearby/png/icon-app-rounded.png';

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

async function fetchAsset(origin: string, assetPath: string): Promise<Buffer | null> {
  try {
    const response = await fetch(`${origin}${assetPath}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
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

function resolveOrigin(request: Request): string {
  const configured = getAppUrl();
  if (configured && !configured.includes('localhost')) {
    return configured;
  }
  return new URL(request.url).origin;
}

export async function GET(request: Request) {
  const origin = resolveOrigin(request);

  try {
    const [logo, icon] = await Promise.all([
      fetchAsset(origin, LOGO_PATH),
      fetchAsset(origin, ICON_PATH),
    ]);

    if (!logo || !icon) {
      throw new Error('Brand assets unavailable');
    }

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
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': String(fallback.length),
        'Cache-Control': 'public, max-age=300',
      },
    });
  }
}
