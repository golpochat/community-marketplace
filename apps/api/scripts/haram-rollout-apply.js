/**
 * Apply haram enforcement rollout data:
 * - enable keywordFilters in platform_settings
 * - ensure restricted categories exist with requiresReview
 *
 * Usage (from apps/api):
 *   node scripts/haram-rollout-apply.js
 */
const { PrismaClient } = require('../generated/prisma');
const {
  parseKeywordFilters,
  matchKeywordFilters,
  matchImageHint,
  hardBlockErrorCode,
  imageFlagErrorCode,
} = require('../../../packages/utils/dist/index.js');

const prisma = new PrismaClient();

const RESTRICTED_CATEGORIES = [
  {
    id: '00000000-0000-4000-8000-000000000210',
    slug: 'perfumes',
    name: 'Perfumes',
    description: 'Fragrances — always reviewed (alcohol base).',
  },
  {
    id: '00000000-0000-4000-8000-000000000211',
    slug: 'wellness',
    name: 'Wellness',
    description: 'Herbal / wellness — always reviewed.',
  },
  {
    id: '00000000-0000-4000-8000-000000000212',
    slug: 'supplements',
    name: 'Supplements',
    description: 'Supplements — always reviewed.',
  },
  {
    id: '00000000-0000-4000-8000-000000000213',
    slug: 'collectibles',
    name: 'Collectibles',
    description: 'Collectibles (incl. empty bottles) — always reviewed.',
  },
];

async function enableKeywordFilters() {
  const row = await prisma.platformSettings.findUnique({
    where: { id: 'default' },
    select: { keywordFilters: true },
  });
  if (!row) {
    throw new Error('platform_settings default row missing — run seed first');
  }
  const current = parseKeywordFilters(row.keywordFilters ?? null);
  const next = parseKeywordFilters({ ...current, enabled: true });
  await prisma.platformSettings.update({
    where: { id: 'default' },
    data: { keywordFilters: next },
  });
  console.log('keywordFilters.enabled =', next.enabled);
}

async function ensureRestrictedCategories() {
  for (const cat of RESTRICTED_CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          requiresReview: true,
          isHidden: false,
          isActive: true,
          name: cat.name,
          description: cat.description,
        },
      });
      console.log('updated', cat.slug, 'requiresReview=true');
    } else {
      await prisma.category.create({
        data: {
          id: cat.id,
          slug: cat.slug,
          name: cat.name,
          description: cat.description,
          requiresReview: true,
          isHidden: false,
          isActive: true,
        },
      });
      console.log('created', cat.slug, 'requiresReview=true');
    }
  }
}

function smokeTestMatchers() {
  const hard = matchKeywordFilters('Selling craft beer tonight');
  const soft = matchKeywordFilters('Sealed perfume bottle unused');
  const image = matchImageHint('listing-weapon-photo.jpg');
  console.log('SMOKE hard', hard.tier, hardBlockErrorCode(hard));
  console.log('SMOKE soft', soft.tier, soft.softMatches.slice(0, 3));
  console.log('SMOKE image', image, imageFlagErrorCode(image));
  if (hard.tier !== 'hard' || soft.tier !== 'soft' || !image.includes('weapon')) {
    throw new Error('Smoke matcher checks failed');
  }
}

async function main() {
  smokeTestMatchers();
  await enableKeywordFilters();
  await ensureRestrictedCategories();
  const reviewCats = await prisma.category.findMany({
    where: { requiresReview: true },
    select: { slug: true, name: true },
    orderBy: { slug: 'asc' },
  });
  console.log('requiresReview categories:', reviewCats.map((c) => c.slug).join(', '));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
