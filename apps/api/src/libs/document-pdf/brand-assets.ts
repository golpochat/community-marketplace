import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type { InvoiceCompanyConfig } from '@community-marketplace/config';
import { getInvoiceCompanyConfig } from '@community-marketplace/config';

export function resolveInvoiceBrandAssetPath(
  filename: string,
  config: InvoiceCompanyConfig = getInvoiceCompanyConfig(),
): string | null {
  const envDir = process.env.INVOICE_BRAND_ASSETS_DIR;
  const candidates = [
    envDir,
    join(process.cwd(), 'assets', 'brand'),
    join(process.cwd(), '..', 'web', 'public', 'brand', 'sellnearby', 'png'),
    join(process.cwd(), '..', '..', 'apps', 'web', 'public', 'brand', 'sellnearby', 'png'),
  ].filter((value): value is string => Boolean(value));

  for (const dir of candidates) {
    const fullPath = join(dir, filename);
    if (existsSync(fullPath)) return fullPath;
  }

  // Fall back to configured filenames in same search
  if (filename !== config.logoHeaderFile) {
    return resolveInvoiceBrandAssetPath(config.logoHeaderFile, config);
  }
  return null;
}
