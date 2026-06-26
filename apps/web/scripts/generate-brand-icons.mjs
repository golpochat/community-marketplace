import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.resolve(__dirname, '../public/icons');
const svgPath = path.join(iconsDir, 'icon.svg');

async function main() {
  await mkdir(iconsDir, { recursive: true });
  const svg = await readFile(svgPath);

  const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon-32.png', size: 32 },
  ];

  for (const { name, size } of sizes) {
    const buffer = await sharp(svg).resize(size, size).png().toBuffer();
    await writeFile(path.join(iconsDir, name), buffer);
    console.log(`Wrote ${name}`);
  }

  const favicon = await sharp(svg).resize(32, 32).png().toBuffer();
  await writeFile(path.join(iconsDir, 'favicon.ico'), favicon);
  await writeFile(path.resolve(__dirname, '../public/favicon.ico'), favicon);
  console.log('Wrote favicon.ico');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
