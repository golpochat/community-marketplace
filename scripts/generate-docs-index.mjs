#!/usr/bin/env node
/**
 * Generates docs/index.json from the /docs directory tree.
 * Usage: node scripts/generate-docs-index.mjs
 */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const DOCS_DIR = join(ROOT, 'docs');
const OUTPUT = join(DOCS_DIR, 'index.json');

const CATEGORIES = {
  architecture: 'Architecture',
  api: 'API Reference',
  features: 'Feature Specifications',
  infrastructure: 'Infrastructure',
  admin: 'Admin Guide',
  security: 'Security',
  runbooks: 'Runbooks',
  onboarding: 'Developer Onboarding',
  product: 'Product',
  db: 'Database',
};

async function walk(dir, base = DOCS_DIR) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.name.startsWith('.') || entry.name === 'index.json') continue;

    if (entry.isDirectory()) {
      files.push(...(await walk(full, base)));
    } else if (entry.name.endsWith('.md')) {
      const rel = relative(base, full).split(sep).join('/');
      const category = rel.split('/')[0];
      let title = entry.name.replace(/\.md$/, '');
      try {
        const content = await readFile(full, 'utf8');
        const match = content.match(/^#\s+(.+)$/m);
        if (match) title = match[1].trim();
      } catch {
        /* ignore */
      }
      const st = await stat(full);
      files.push({
        path: rel,
        title,
        category: CATEGORIES[category] ?? category,
        categoryId: category,
        updatedAt: st.mtime.toISOString().slice(0, 10),
      });
    }
  }

  return files;
}

async function main() {
  const files = await walk(DOCS_DIR);
  files.sort((a, b) => a.path.localeCompare(b.path));

  const byCategory = {};
  for (const f of files) {
    if (!byCategory[f.categoryId]) {
      byCategory[f.categoryId] = {
        label: f.category,
        files: [],
      };
    }
    byCategory[f.categoryId].files.push({
      path: f.path,
      title: f.title,
      updatedAt: f.updatedAt,
    });
  }

  const index = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    docCount: files.length,
    categories: byCategory,
    files,
  };

  await writeFile(OUTPUT, `${JSON.stringify(index, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${files.length} entries to docs/index.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
