/**
 * Build the static homepage OG JPEG (1200×630).
 *
 * IMPORTANT: Run only on a dev machine (Windows/macOS/Linux with fonts), NOT in
 * Docker/Alpine CI. Brand logos use SVG <text>; Alpine sharp/librsvg renders
 * that text as hollow rectangles without fontconfig + Inter installed.
 *
 * Layout: stacked logo fits inside WhatsApp's centre-square crop (~630×630).
 * Horizontal logos get clipped on the sides in WhatsApp chat thumbnails.
 *
 * Usage: pnpm --filter @community-marketplace/web og:generate
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, '..');
const brandDir = path.join(webRoot, 'public', 'brand', 'sellnearby', 'png');
const outDir = path.join(webRoot, 'public', 'og');
const outFile = path.join(outDir, 'sellnearby-home.jpg');

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
/** WhatsApp crops a centre square from 1200×630 — keep branding inside this box. */
const SAFE_SIZE = 540;

function buildBackgroundSvg() {
  return Buffer.from(`
    <svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0D9488"/>
          <stop offset="55%" stop-color="#0F766E"/>
          <stop offset="100%" stop-color="#115E59"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="48%" r="42%">
          <stop offset="0%" stop-color="#5EEAD4" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#5EEAD4" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)"/>
      <rect width="100%" height="100%" fill="url(#glow)"/>
    </svg>`);
}

async function main() {
  if (process.env.CI === 'true' || process.env.SKIP_OG_GENERATE === '1') {
    console.log('Skipping OG generation (CI or SKIP_OG_GENERATE=1). Using committed asset.');
    return;
  }

  await mkdir(outDir, { recursive: true });

  const logo = await readFile(path.join(brandDir, 'logo-stacked-dark-mode.png'));

  const background = await sharp(buildBackgroundSvg()).png().toBuffer();
  const logoLayer = await sharp(logo).resize(SAFE_SIZE, SAFE_SIZE, { fit: 'inside' }).png().toBuffer();
  const logoMeta = await sharp(logoLayer).metadata();
  const logoWidth = logoMeta.width ?? SAFE_SIZE;
  const logoHeight = logoMeta.height ?? SAFE_SIZE;
  const logoLeft = Math.round((OG_WIDTH - logoWidth) / 2);
  const logoTop = Math.round((OG_HEIGHT - logoHeight) / 2);

  const output = await sharp(background)
    .composite([{ input: logoLayer, top: logoTop, left: logoLeft }])
    .jpeg({ quality: 90, progressive: false, mozjpeg: false })
    .toBuffer();

  await writeFile(outFile, output);
  const meta = await sharp(output).metadata();
  console.log(`Wrote ${outFile} (${meta.width}x${meta.height}, ${output.length} bytes)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
