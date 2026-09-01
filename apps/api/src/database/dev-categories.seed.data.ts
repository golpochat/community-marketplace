export interface DevCategorySeedEntry {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
}

/** Stable IDs for local development and tests. Icon values match category slug keys for Lucide mapping. */
export const DEV_CATEGORY_SEED: DevCategorySeedEntry[] = [
  {
    id: '00000000-0000-4000-8000-000000000100',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Phones, computers, audio, and gadgets',
    icon: 'electronics',
  },
  {
    id: '00000000-0000-4000-8000-000000000101',
    name: 'Furniture',
    slug: 'furniture',
    description: 'Home and office furniture',
    icon: 'furniture',
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    name: 'Clothing',
    slug: 'clothing',
    description: 'Apparel, shoes, and accessories',
    icon: 'clothing',
  },
  {
    id: '00000000-0000-4000-8000-000000000103',
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    description: 'Sports gear, bikes, and outdoor equipment',
    icon: 'sports-outdoors',
  },
  {
    id: '00000000-0000-4000-8000-000000000104',
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Tools, décor, and garden items',
    icon: 'home-garden',
  },
  {
    id: '00000000-0000-4000-8000-000000000105',
    name: 'Vehicles',
    slug: 'vehicles',
    description: 'Cars, motorbikes, and parts',
    icon: 'vehicles',
  },
  {
    id: '00000000-0000-4000-8000-000000000106',
    name: 'Services',
    slug: 'services',
    description: 'Local services offered by sellers',
    icon: 'services',
  },
  {
    id: '00000000-0000-4000-8000-000000000107',
    name: 'Other',
    slug: 'other',
    description: 'Everything else',
    icon: 'other',
  },
];
