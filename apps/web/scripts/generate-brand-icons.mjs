import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.resolve(__dirname, '../public/icons');
const publicDir = path.resolve(__dirname, '../public');
const svgPath = path.join(iconsDir, 'icon-app.svg');

async function main() {
  await mkdir(iconsDir, { recursive: true });
  const svg = await readFile(svgPath);

  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon-48.png', size: 48 },
    { name: 'favicon-32.png', size: 32 },
  ];

  for (const { name, size } of sizes) {
    const buffer = await sharp(svg).resize(size, size).png().toBuffer();
    await writeFile(path.join(iconsDir, name), buffer);
    console.log(`Wrote ${name}`);
  }

  const favicon48 = await sharp(svg).resize(48, 48).png().toBuffer();
  await writeFile(path.join(publicDir, 'favicon.ico'), favicon48);
  await writeFile(path.join(iconsDir, 'favicon.ico'), favicon48);
  await writeFile(path.resolve(__dirname, '../src/app/icon.png'), favicon48);
  console.log('Wrote favicon.ico + app/icon.png (48x48 PNG)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
