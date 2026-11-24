/**
 * Replace Perfumes + Supplements with Mum & Baby + Freebies (same stable IDs).
 *
 * Usage (from apps/api, with DATABASE_URL set):
 *   node scripts/replace-pilot-categories.js
 *
 * On VPS after deploy:
 *   docker compose -f infra/docker/docker-compose.prod.yml --env-file infra/docker/.env.prod \
 *     exec -T api node scripts/replace-pilot-categories.js
 */
const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

const REPLACEMENTS = [
  {
    id: '00000000-0000-4000-8000-000000000210',
    oldSlugs: ['perfumes'],
    slug: 'mum-baby',
    name: 'Mum & Baby',
    description: 'Prams, cots, toys, baby clothes, and kids kit',
    icon: 'mum-baby',
    requiresReview: false,
  },
  {
    id: '00000000-0000-4000-8000-000000000212',
    oldSlugs: ['supplements'],
    slug: 'freebies',
    name: 'Freebies',
    description: 'Giveaways and free local items (€0)',
    icon: 'freebies',
    requiresReview: false,
  },
];

async function replaceOne(entry) {
  const byId = await prisma.category.findUnique({ where: { id: entry.id } });
  const byOldSlug = await prisma.category.findFirst({
    where: { slug: { in: entry.oldSlugs } },
  });
  const byNewSlug = await prisma.category.findUnique({ where: { slug: entry.slug } });

  const target = byId ?? byOldSlug;
  if (!target) {
    if (byNewSlug) {
      console.log('already present', entry.slug, byNewSlug.id);
      return;
    }
    await prisma.category.create({
      data: {
        id: entry.id,
        slug: entry.slug,
        name: entry.name,
        description: entry.description,
        icon: entry.icon,
        requiresReview: entry.requiresReview,
        isHidden: false,
        isActive: true,
      },
    });
    console.log('created', entry.slug);
    return;
  }

  if (byNewSlug && byNewSlug.id !== target.id) {
    throw new Error(
      `Slug "${entry.slug}" already used by category ${byNewSlug.id}; cannot replace ${target.id}`,
    );
  }

  await prisma.category.update({
    where: { id: target.id },
    data: {
      slug: entry.slug,
      name: entry.name,
      description: entry.description,
      icon: entry.icon,
      requiresReview: entry.requiresReview,
      isHidden: false,
      isActive: true,
    },
  });
  console.log('replaced', target.slug, '→', entry.slug, `(${target.id})`);
}

async function main() {
  for (const entry of REPLACEMENTS) {
    await replaceOne(entry);
  }

  const rows = await prisma.category.findMany({
    where: { isActive: true, isHidden: false },
    select: { slug: true, name: true, requiresReview: true },
    orderBy: { name: 'asc' },
  });
  console.log(
    'active categories:',
    rows.map((r) => `${r.name} (${r.slug}${r.requiresReview ? ', review' : ''})`).join(' | '),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
