export interface ListingLocation {
  slug: string;
  name: string;
  county: string;
  browseArea: string;
  intro: string;
  highlights: string[];
  meetUpHint: string;
}

/** Major Irish cities/towns for geo-targeted browse landing pages at `/listings/{slug}`. */
export const LISTING_LOCATIONS: ListingLocation[] = [
  {
    slug: 'dublin',
    name: 'Dublin',
    county: 'Dublin',
    browseArea: 'Dublin',
    intro:
      'Browse second-hand items across Dublin — from city-centre apartments to suburbs like Dundrum, Swords, and Lucan. Furniture, electronics, bikes, and nursery gear move quickly when priced fairly and photographed clearly.',
    highlights: [
      'High demand for furniture before lease end-of-month moves',
      'M50 corridor buyers often filter by collection vs local delivery',
      'Student areas (Rathmines, Drumcondra) peak at term start',
    ],
    meetUpHint: 'Busy meet spots include high-street cafés, shopping-centre car parks, and Luas stops.',
  },
  {
    slug: 'cork',
    name: 'Cork',
    county: 'Cork',
    browseArea: 'Cork',
    intro:
      'Cork city and suburbs have a strong local marketplace — Ballincollig, Douglas, and Mahon buyers frequently collect same-day for larger homeware and garden items.',
    highlights: [
      'UCC term drives desk, mini-fridge, and bike listings',
      'Coastal suburbs list outdoor and sports gear seasonally',
      'Honest item condition notes build trust county-wide',
    ],
    meetUpHint: 'Patrick Street and Mahon Point are popular public handover locations.',
  },
  {
    slug: 'galway',
    name: 'Galway',
    county: 'Galway',
    browseArea: 'Galway',
    intro:
      'Galway listings span the city, Salthill, and towns across the county. Tourism and student turnover keep the market active for bikes, camping gear, and household essentials.',
    highlights: [
      'Arts & crafts and musical gear niches perform well',
      'Summer demand for outdoor furniture and BBQ equipment',
      'Include suburb or town name for faster local discovery',
    ],
    meetUpHint: 'Eyre Square and Salthill promenade suit daytime collections.',
  },
  {
    slug: 'limerick',
    name: 'Limerick',
    county: 'Limerick',
    browseArea: 'Limerick',
    intro:
      'Limerick buyers search for value on furniture, appliances, and children\'s equipment. UL term starts and housing moves create predictable listing spikes.',
    highlights: [
      'Castletroy and Raheen families list prams and cots regularly',
      'Electronics and gaming gear sell fast with serial photos',
      'City-centre collection works well for smaller items',
    ],
    meetUpHint: 'The Crescent and city-centre retail areas are practical meet points.',
  },
  {
    slug: 'waterford',
    name: 'Waterford',
    county: 'Waterford',
    browseArea: 'Waterford',
    intro:
      'Waterford city and Dungarvan corridor listings favour practical homeware and tools. Buyers often travel within the county for the right price.',
    highlights: [
      'Same-day collection common for sofas and white goods',
      'Greenway towns add rural listings worth the short drive',
      'Clear dimensions in descriptions reduce wasted visits',
    ],
    meetUpHint: 'Waterford city retail parks offer safe, busy collection points.',
  },
  {
    slug: 'kilkenny',
    name: 'Kilkenny',
    county: 'Kilkenny',
    browseArea: 'Kilkenny',
    intro:
      'Kilkenny\'s compact city makes local collection easy — vintage homeware, bikes, and garden tools are steady sellers among neighbours.',
    highlights: [
      'Medieval city centre cafés suit small-item handovers',
      'Antique and character furniture attracts county-wide buyers',
      'Weekend mornings are popular for furniture collections',
    ],
    meetUpHint: 'MacDonagh Junction and city-centre car parks work well.',
  },
  {
    slug: 'drogheda',
    name: 'Drogheda',
    county: 'Louth',
    browseArea: 'Drogheda',
    intro:
      'Drogheda sits between Dublin and Belfast corridors — list with clear collection location and expect buyers from Louth and Meath.',
    highlights: [
      'Commuter families list nursery and garden gear often',
      'Include north vs south Drogheda in messages for clarity',
      'Fair pricing beats waiting for Dublin buyers to travel',
    ],
    meetUpHint: 'Scotch Hall and town-centre retail areas are common meet spots.',
  },
  {
    slug: 'dundalk',
    name: 'Dundalk',
    county: 'Louth',
    browseArea: 'Dundalk',
    intro:
      'Dundalk listings serve local buyers across Louth with strong same-county collection rates for furniture and childcare items.',
    highlights: [
      'Outlet village area suits larger-item handovers',
      'Cross-border interest — keep payments on-platform until collection',
      'Photos in daylight help items stand out in browse grids',
    ],
    meetUpHint: 'Dundalk Shopping Centre car park is a typical collection hub.',
  },
  {
    slug: 'bray',
    name: 'Bray',
    county: 'Wicklow',
    browseArea: 'Bray',
    intro:
      'Bray and north Wicklow listings reach Dublin commuters and local families — outdoor gear, furniture, and bikes are common categories.',
    highlights: [
      'Seafront and Main Street areas are busy meet locations',
      'Commuter sellers often offer evening collection windows',
      'Include Wicklow vs Dublin location to set buyer expectations',
    ],
    meetUpHint: 'Bray Main Street and retail car parks suit daytime meets.',
  },
  {
    slug: 'navan',
    name: 'Navan',
    county: 'Meath',
    browseArea: 'Navan',
    intro:
      'Navan anchors Meath\'s local marketplace — families list prams, garden tools, and furniture with buyers collecting from across the county.',
    highlights: [
      'Town-centre collections work for most item sizes',
      'Ashbourne and Trim buyers also search Meath listings',
      'Bundle kids\' items to attract fuller-basket collections',
    ],
    meetUpHint: 'Navan Town Centre and nearby retail parks are practical handover spots.',
  },
];

const LOCATION_SLUGS = new Set(LISTING_LOCATIONS.map((location) => location.slug));

export function isListingLocationSlug(slug: string): boolean {
  return LOCATION_SLUGS.has(slug.toLowerCase());
}

export function getListingLocationBySlug(slug: string): ListingLocation | undefined {
  return LISTING_LOCATIONS.find((location) => location.slug === slug.toLowerCase());
}

export function buildListingLocationPath(slug: string): string {
  return `/listings/${encodeURIComponent(slug)}`;
}
