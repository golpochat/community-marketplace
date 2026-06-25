import type { PrismaClient } from '@prisma/client';

import { DEV_CATEGORY_SEED } from '../dev-categories.seed.data';
import { assertRbacSeedAllowed } from './seed-environment';
import { loadRbacSeedConfig } from './seed-config';

export interface DevCategoriesSeedResult {
  categoriesUpserted: number;
}

export async function runDevCategoriesSeed(prisma: PrismaClient): Promise<DevCategoriesSeedResult> {
  const config = loadRbacSeedConfig();
  assertRbacSeedAllowed(config);

  console.log('[dev-categories-seed] Starting (NODE_ENV=%s)', config.NODE_ENV);

  let categoriesUpserted = 0;

  for (const entry of DEV_CATEGORY_SEED) {
    await prisma.$executeRaw`
      INSERT INTO categories (id, name, slug, description, icon, is_active, created_at, updated_at)
      VALUES (
        ${entry.id},
        ${entry.name},
        ${entry.slug},
        ${entry.description},
        ${entry.icon},
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        is_active = EXCLUDED.is_active,
        updated_at = CURRENT_TIMESTAMP
    `;
    categoriesUpserted += 1;
  }

  console.log('[dev-categories-seed] Upserted %d categories', categoriesUpserted);
  return { categoriesUpserted };
}
