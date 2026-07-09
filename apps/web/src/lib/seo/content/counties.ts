export interface IrishCounty {
  slug: string;
  name: string;
  /** Value passed to `/listings?area=` browse filter. */
  browseArea: string;
  intro: string;
  localTips: string[];
}

export const IRISH_COUNTIES: IrishCounty[] = [
  {
    slug: 'dublin',
    name: 'Dublin',
    browseArea: 'Dublin',
    intro:
      'From city apartments to suburban family homes, Dublin has one of Ireland\'s busiest second-hand markets. Neighbours sell furniture before moves, upgrade bikes, and clear garages every weekend.',
    localTips: [
      'Meet buyers in busy public spots — Grafton Street cafés, Dundrum Town Centre, or your local library car park.',
      'Dublin buyers often ask about delivery within the M50 — state collection vs delivery clearly in your listing.',
    ],
  },
  {
    slug: 'cork',
    name: 'Cork',
    browseArea: 'Cork',
    intro:
      'Cork\'s strong community spirit makes it ideal for local selling. Students, families, and traders across the city and county regularly list quality used goods.',
    localTips: [
      'Patrick\'s Street and Mahon Point are popular meet-up areas for handovers.',
      'Include your town or suburb (Ballincollig, Douglas, Cobh) so nearby buyers find you faster.',
    ],
  },
  {
    slug: 'galway',
    name: 'Galway',
    browseArea: 'Galway',
    intro:
      'Galway combines a vibrant city market with rural listings across Connemara and the county. Seasonal moves and festival turnover keep listings fresh.',
    localTips: [
      'Eyre Square and Salthill are well-lit, busy meet-up locations.',
      'Tourism season brings demand for camping gear, bikes, and household items — price competitively.',
    ],
  },
  {
    slug: 'limerick',
    name: 'Limerick',
    browseArea: 'Limerick',
    intro:
      'Limerick city and county have a growing community marketplace scene, especially for furniture, electronics, and children\'s items.',
    localTips: [
      'The Crescent Shopping Centre area works well for daytime collections.',
      'University term starts drive demand for desks, mini-fridges, and textbooks.',
    ],
  },
  {
    slug: 'waterford',
    name: 'Waterford',
    browseArea: 'Waterford',
    intro:
      'Waterford sellers benefit from a tight-knit county network — buyers often collect the same day for larger items like sofas and appliances.',
    localTips: [
      'Waterford Greenway nearby towns (Dungarvan, Kilmeaden) are handy public meet points.',
      'Photograph crystal-clear serial numbers on electronics to build buyer trust.',
    ],
  },
  {
    slug: 'kerry',
    name: 'Kerry',
    browseArea: 'Kerry',
    intro:
      'From Tralee to Killarney, Kerry listings range from outdoor gear to home essentials. Local trust matters — buyers prefer sellers who respond quickly.',
    localTips: [
      'Killarney town centre and Tralee Manor West are practical collection hubs.',
      'Tourism-related gear (kayaks, camping stoves) sells fast in spring — list early.',
    ],
  },
  {
    slug: 'wicklow',
    name: 'Wicklow',
    browseArea: 'Wicklow',
    intro:
      'Wicklow\'s mix of commuter towns and coastal villages creates steady demand for furniture, garden tools, and children\'s equipment.',
    localTips: [
      'Bray Main Street and Greystones harbour area are safe, busy meet-up spots.',
      'Commuters appreciate weekday evening collection slots — mention availability in messages.',
    ],
  },
  {
    slug: 'meath',
    name: 'Meath',
    browseArea: 'Meath',
    intro:
      'Meath families frequently sell prams, cots, and garden furniture as kids grow. Navan, Ashbourne, and Dunboyne are active local markets.',
    localTips: [
      'Navan Town Centre car parks are well suited for larger item handovers.',
      'Include estate or village name — Meath covers a wide area and buyers filter locally.',
    ],
  },
  {
    slug: 'kildare',
    name: 'Kildare',
    browseArea: 'Kildare',
    intro:
      'Kildare\'s commuter belt towns (Naas, Newbridge, Celbridge) have strong listing activity, especially around school terms and house moves.',
    localTips: [
      'Whitewater Shopping Centre (Newbridge) and Naas town centre are reliable meet locations.',
      'Horse-country areas often list tack and outdoor equipment — niche items attract county-wide buyers.',
    ],
  },
  {
    slug: 'louth',
    name: 'Louth',
    browseArea: 'Louth',
    intro:
      'Drogheda and Dundalk anchor Louth\'s local marketplace. Cross-border buyers sometimes enquire — stay within platform messaging for safety.',
    localTips: [
      'Drogheda town centre and Dundalk Shopping Centre are practical handover points.',
      'Border proximity means clear pricing in euro and collection-only terms reduce confusion.',
    ],
  },
  {
    slug: 'kilkenny',
    name: 'Kilkenny',
    browseArea: 'Kilkenny',
    intro:
      'Kilkenny\'s compact city and surrounding villages make same-day collections common for furniture and homeware.',
    localTips: [
      'Medieval Mile area cafés and MacDonagh Junction work well for meet-ups.',
      'Antique and vintage homeware performs well — highlight condition honestly in photos.',
    ],
  },
  {
    slug: 'wexford',
    name: 'Wexford',
    browseArea: 'Wexford',
    intro:
      'Wexford town and coastal villages see seasonal turnover in outdoor furniture, bikes, and gardening tools.',
    localTips: [
      'Redmond Square and Wexford retail parks offer busy daytime collection spots.',
      'Summer listings for beach gear and BBQ equipment peak in April–May.',
    ],
  },
  {
    slug: 'clare',
    name: 'Clare',
    browseArea: 'Clare',
    intro:
      'Ennis and coastal Clare communities list everything from musical instruments to farming equipment. Local collection is the norm.',
    localTips: [
      'Ennis town centre is a central meet point for county buyers.',
      'Traditional music gear and outdoor equipment — mention Ennis vs Lahinch location clearly.',
    ],
  },
  {
    slug: 'tipperary',
    name: 'Tipperary',
    browseArea: 'Tipperary',
    intro:
      'Tipperary spans a large area — Clonmel, Nenagh, and Thurles each have active local buyers. Specific location labels help discovery.',
    localTips: [
      'Clonmel town and Thurles retail parks suit furniture collections.',
      'Agricultural and DIY tools sell well — note if buyer needs a van or trailer.',
    ],
  },
  {
    slug: 'mayo',
    name: 'Mayo',
    browseArea: 'Mayo',
    intro:
      'Castlebar and Ballina lead Mayo\'s local selling activity. Rural listings for tools, furniture, and vehicles reach buyers county-wide.',
    localTips: [
      'Castlebar Main Street is a practical central meet location.',
      'Long-distance buyers may ask about delivery — agree terms in writing on-platform.',
    ],
  },
  {
    slug: 'donegal',
    name: 'Donegal',
    browseArea: 'Donegal',
    intro:
      'Donegal\'s dispersed communities rely on clear photos and honest descriptions. Letterkenny anchors much of the county\'s marketplace activity.',
    localTips: [
      'Letterkenny Retail Park offers a busy, safe handover environment.',
      'Weather-resistant storage keeps outdoor gear listings looking professional year-round.',
    ],
  },
  {
    slug: 'westmeath',
    name: 'Westmeath',
    browseArea: 'Westmeath',
    intro:
      'Athlone connects Westmeath buyers and sellers across the midlands. Family homes frequently list cots, buggies, and dining sets.',
    localTips: [
      'Athlone town centre and Golden Island Shopping Centre are popular meet spots.',
      'Midlands location can attract buyers from neighbouring counties — respond promptly.',
    ],
  },
  {
    slug: 'laois',
    name: 'Laois',
    browseArea: 'Laois',
    intro:
      'Portlaoise and surrounding towns have a practical, no-nonsense selling culture — fair pricing and quick replies win sales.',
    localTips: [
      'Portlaoise Main Street and Kyle Centre suit daytime collections.',
      'Include Portarlington or Mountmellick when relevant so local filters work.',
    ],
  },
  {
    slug: 'offaly',
    name: 'Offaly',
    browseArea: 'Offaly',
    intro:
      'Tullamore and Birr sellers often list farm-adjacent equipment, furniture, and children\'s items with strong same-county collection rates.',
    localTips: [
      'Tullamore town centre works well for general merchandise handovers.',
      'Larger items — note driveway access and whether help is needed to load.',
    ],
  },
  {
    slug: 'longford',
    name: 'Longford',
    browseArea: 'Longford',
    intro:
      'Longford\'s close community means word-of-mouth complements online listings. Quality photos help items stand out county-wide.',
    localTips: [
      'Longford town Main Street offers a straightforward meet-up location.',
      'Bundle smaller items (kitchenware, toys) to attract fuller-basket buyers.',
    ],
  },
  {
    slug: 'roscommon',
    name: 'Roscommon',
    browseArea: 'Roscommon',
    intro:
      'Roscommon town and Boyle area listings lean toward homeware, tools, and outdoor equipment with loyal repeat local buyers.',
    localTips: [
      'Roscommon town centre is the usual collection hub.',
      'Honest condition notes matter — rural buyers often travel 20–30 km for the right deal.',
    ],
  },
  {
    slug: 'sligo',
    name: 'Sligo',
    browseArea: 'Sligo',
    intro:
      'Sligo town and Strandhill area combine student, family, and outdoor lifestyle listings — surf gear to nursery furniture.',
    localTips: [
      'Sligo town and Quayside Shopping Centre are busy, safe meet locations.',
      'Student term changeovers (ATU Sligo) create predictable demand spikes.',
    ],
  },
  {
    slug: 'leitrim',
    name: 'Leitrim',
    browseArea: 'Leitrim',
    intro:
      'Leitrim\'s smaller population rewards sellers who describe location precisely and price fairly for county-wide reach.',
    localTips: [
      'Carrick-on-Shannon main street suits most handovers.',
      'Highlight if item is near the N4 corridor for midlands buyers passing through.',
    ],
  },
  {
    slug: 'cavan',
    name: 'Cavan',
    browseArea: 'Cavan',
    intro:
      'Cavan town links Ulster border buyers with local sellers. Furniture and childcare items move quickly with clear collection arrangements.',
    localTips: [
      'Cavan town centre and The Diamond area are practical meet points.',
      'Cross-border interest — keep all payment discussion on-platform until handover.',
    ],
  },
  {
    slug: 'monaghan',
    name: 'Monaghan',
    browseArea: 'Monaghan',
    intro:
      'Monaghan town and Clones area sellers benefit from including Eircode or townland hints in messages for rural collections.',
    localTips: [
      'Monaghan town centre works for most categories.',
      'Agricultural and equestrian gear — specify exact pickup location early.',
    ],
  },
  {
    slug: 'carlow',
    name: 'Carlow',
    browseArea: 'Carlow',
    intro:
      'Carlow town and Hacketstown corridor listings serve families upgrading homes and students furnishing rentals.',
    localTips: [
      'Carlow town centre and Fairgreen meet-ups are common for local trades.',
      'Proximity to Kilkenny and Kildare — mention county to avoid buyer confusion.',
    ],
  },
];

export function getCountyBySlug(slug: string): IrishCounty | undefined {
  return IRISH_COUNTIES.find((county) => county.slug === slug);
}

export function buildLocalCountyPath(slug: string): string {
  return `/local/${encodeURIComponent(slug)}`;
}
