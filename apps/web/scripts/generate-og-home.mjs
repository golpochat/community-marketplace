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

function buildBackgroundSvg() {
  return Buffer.from(`
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
    </svg>`);
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const [logo, icon] = await Promise.all([
    readFile(path.join(brandDir, 'logo-dark-mode-compact.png')),
    readFile(path.join(brandDir, 'icon-app-rounded.png')),
  ]);

  const background = await sharp(buildBackgroundSvg()).png().toBuffer();
  const logoLayer = await sharp(logo).resize(640, 168, { fit: 'inside' }).png().toBuffer();
  const logoMeta = await sharp(logoLayer).metadata();
  const iconLayer = await sharp(icon).resize(200, 200).png().toBuffer();

  const logoTop = Math.round((OG_HEIGHT - (logoMeta.height ?? 168)) / 2);
  const iconTop = Math.round((OG_HEIGHT - 200) / 2);

  const output = await sharp(background)
    .composite([
      { input: logoLayer, top: logoTop, left: 72 },
      { input: iconLayer, top: iconTop, left: 900 },
    ])
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
