export interface SuccessStory {
  id: string;
  quote: string;
  summary: string;
  area: string;
  county: string;
  tag: string;
  role: 'seller' | 'buyer';
  itemType: string;
  categorySlug?: string;
  outcome: string;
}

export const SUCCESS_STORIES: SuccessStory[] = [
  {
    id: 'goatstown-dining-set',
    quote: 'Sold our dining set in under an hour — a family from Goatstown collected the same evening.',
    summary:
      'Emma listed a six-seater oak dining set before a move to Cork. Clear photos, a fair price, and "collection only Goatstown" in the title brought three messages within forty minutes.',
    area: 'Goatstown',
    county: 'Dublin',
    tag: 'Quick sale',
    role: 'seller',
    itemType: 'Furniture',
    categorySlug: 'furniture',
    outcome: 'Collected same day · No fees',
  },
  {
    id: 'dundrum-sofa',
    quote: 'Picked up a free sofa for the kids\' room — lovely neighbour, zero hassle.',
    summary:
      'Mark browsed free listings in Dundrum while furnishing a spare room. The seller preferred a local family over dumping usable furniture — both sides messaged on-platform and met at a retail car park.',
    area: 'Dundrum',
    county: 'Dublin',
    tag: 'Free item',
    role: 'buyer',
    itemType: 'Furniture',
    categorySlug: 'furniture',
    outcome: 'Free local pickup · Same week',
  },
  {
    id: 'sandyford-laptop',
    quote: 'Found a refurbished laptop for school at half retail — met at the café and it was exactly as described.',
    summary:
      'Aoife needed a laptop for secondary school. She filtered verified sellers near Sandyford, checked serial photos in the listing, and paid cash on collection after testing the machine.',
    area: 'Sandyford',
    county: 'Dublin',
    tag: 'Great deal',
    role: 'buyer',
    itemType: 'Electronics',
    categorySlug: 'electronics',
    outcome: 'Saved ~50% vs new · Verified seller',
  },
  {
    id: 'rathmines-bike',
    quote: 'Listed my bike on lunch break and had three serious messages by dinner.',
    summary:
      'Paul upgraded to an e-bike and listed his hybrid with honest wear photos. Rathmines location and same-day availability in the description led to a sale to a commuter two suburbs away.',
    area: 'Rathmines',
    county: 'Dublin',
    tag: 'Local reach',
    role: 'seller',
    itemType: 'Sports & leisure',
    categorySlug: 'sports-outdoors',
    outcome: 'Sold within 24 hours',
  },
  {
    id: 'cork-pram',
    quote: 'Our pram went to a first-time parent in Ballincollig — felt good knowing it was reused, not binned.',
    summary:
      'Sarah and James sold a premium pram after their youngest outgrew it. They linked to their seller store, answered sizing questions quickly, and met at Mahon Point on a Saturday morning.',
    area: 'Ballincollig',
    county: 'Cork',
    tag: 'Community reuse',
    role: 'seller',
    itemType: 'Baby & kids',
    categorySlug: 'clothing',
    outcome: 'Rehomed in 3 days',
  },
  {
    id: 'galway-garden',
    quote: 'Bought a patio set from a neighbour in Salthill — half the cost of the garden centre and delivered in his van.',
    summary:
      'Tom searched garden listings before summer. A Salthill seller included delivery to Galway city for a small fee agreed in chat — still cheaper than flat-pack retail with assembly hassle.',
    area: 'Salthill',
    county: 'Galway',
    tag: 'Seasonal find',
    role: 'buyer',
    itemType: 'Garden',
    categorySlug: 'home-garden',
    outcome: 'Ready for summer · Local seller',
  },
];
