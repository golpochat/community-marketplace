import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

const products = [
  {
    code: 'boost_7d',
    name: '7-day boost',
    description: 'Boost listing visibility for 7 days',
    type: 'listing_boost',
    status: 'published',
    price: 1.99,
    currency: 'EUR',
    durationDays: 7,
    packageType: 'PAID_7D',
    sortOrder: 10,
  },
  {
    code: 'boost_30d',
    name: '30-day boost',
    description: 'Boost listing visibility for 30 days',
    type: 'listing_boost',
    status: 'published',
    price: 4.99,
    currency: 'EUR',
    durationDays: 30,
    packageType: 'PAID_30D',
    sortOrder: 20,
  },
  {
    code: 'featured_homepage',
    name: 'Homepage featured',
    description: 'Featured placement on the homepage',
    type: 'featured_slot',
    status: 'published',
    price: 2.99,
    currency: 'EUR',
    durationHours: 24,
    placement: 'homepage',
    slotsPerDay: 8,
    sortOrder: 10,
  },
  {
    code: 'featured_category',
    name: 'Category featured',
    description: 'Featured placement in category browse',
    type: 'featured_slot',
    status: 'published',
    price: 1.99,
    currency: 'EUR',
    durationHours: 24,
    placement: 'category',
    slotsPerDay: 4,
    sortOrder: 20,
  },
];

const count = await prisma.monetizationProduct.count();
console.log(`Existing products: ${count}`);

if (count === 0) {
  const result = await prisma.monetizationProduct.createMany({ data: products });
  console.log(`Seeded ${result.count} products`);
} else {
  console.log('Skipping seed — products already exist');
}

await prisma.$disconnect();
