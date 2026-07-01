#!/usr/bin/env node

/**

 * Export SellNearby.ie brand SVGs to PNG and WebP at all required sizes.

 * Usage: node scripts/brand/export-sellnearby.mjs

 */

import { mkdir, writeFile } from 'node:fs/promises';

import { createRequire } from 'node:module';

import path from 'node:path';

import { fileURLToPath } from 'node:url';



const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROOT = path.resolve(__dirname, '../..');

const require = createRequire(path.join(ROOT, 'apps/web/package.json'));

const sharp = require('sharp');

import {
  BRAND,
  LOGO_RASTER_SIZES,
  LOGO_VARIANTS,
  iconAppRoundedSvg,
  iconMarkSvg,
  resolveTheme,
} from './sellnearby-shared.svg.js';



const BRAND_DIR = path.join(ROOT, 'apps/web/public/brand/sellnearby');

const SVG_DIR = path.join(BRAND_DIR, 'svg');

const PNG_DIR = path.join(BRAND_DIR, 'png');

const WEBP_DIR = path.join(BRAND_DIR, 'webp');

const ICONS_DIR = path.join(ROOT, 'apps/web/public/icons');



const FAVICON_SIZES = [16, 32, 64, 128, 256, 512];

async function rasterize(svg, width, height, outPath, format) {

  const pipeline = sharp(Buffer.from(svg)).resize(width, height, {

    fit: 'contain',

    background: { r: 0, g: 0, b: 0, alpha: 0 },

  });

  if (format === 'webp') {

    await pipeline.webp({ quality: 92 }).toFile(outPath);

  } else {

    await pipeline.png().toFile(outPath);

  }

}



async function main() {

  await mkdir(SVG_DIR, { recursive: true });

  await mkdir(PNG_DIR, { recursive: true });

  await mkdir(WEBP_DIR, { recursive: true });



  const iconSvg = iconMarkSvg(resolveTheme());

  await writeFile(path.join(SVG_DIR, 'icon-mark.svg'), iconSvg.trim() + '\n', 'utf8');

  console.log('Wrote apps/web/public/brand/sellnearby/svg/icon-mark.svg');



  for (const { name, fn } of LOGO_VARIANTS) {

    const content = fn();

    const svgPath = path.join(SVG_DIR, `${name}.svg`);

    await writeFile(svgPath, content.trim() + '\n', 'utf8');

    console.log(`Wrote ${path.relative(ROOT, svgPath)}`);

  }



  const iconSvgFlat = iconMarkSvg({ ...resolveTheme(), shadow: false });



  for (const size of FAVICON_SIZES) {

    const pngName = `icon-${size}.png`;

    const webpName = `icon-${size}.webp`;

    await rasterize(iconSvgFlat, size, size, path.join(PNG_DIR, pngName), 'png');

    await rasterize(iconSvgFlat, size, size, path.join(WEBP_DIR, webpName), 'webp');

    console.log(`Exported ${pngName}, ${webpName}`);

  }



  for (const { name, fn } of LOGO_VARIANTS) {

    const svg = fn();

    const dims = LOGO_RASTER_SIZES[name];

    if (!dims) continue;

    await rasterize(svg, dims.w, dims.h, path.join(PNG_DIR, `${name}.png`), 'png');

    await rasterize(svg, dims.w, dims.h, path.join(WEBP_DIR, `${name}.webp`), 'webp');

    console.log(`Exported ${name}.png / .webp`);

  }



  await mkdir(ICONS_DIR, { recursive: true });

  const iconAppSvg = iconAppRoundedSvg();
  await writeFile(path.join(ICONS_DIR, 'icon.svg'), iconSvgFlat.trim() + '\n', 'utf8');
  await writeFile(path.join(ICONS_DIR, 'icon-app.svg'), iconAppSvg.trim() + '\n', 'utf8');

  await rasterize(iconAppSvg, 512, 512, path.join(ICONS_DIR, 'icon-512.png'), 'png');
  await rasterize(iconAppSvg, 192, 192, path.join(ICONS_DIR, 'icon-192.png'), 'png');
  await rasterize(iconSvgFlat, 32, 32, path.join(ICONS_DIR, 'favicon-32.png'), 'png');
  await rasterize(iconAppSvg, 180, 180, path.join(ICONS_DIR, 'apple-touch-icon.png'), 'png');



  await sharp(path.join(ICONS_DIR, 'favicon-32.png')).resize(32, 32).toFile(path.join(ICONS_DIR, 'favicon.ico'));



  console.log('\nInstalled favicons to apps/web/public/icons/');

  console.log('Brand palette:', BRAND);

}



main().catch((err) => {

  console.error(err);

  process.exit(1);

});

