export interface GuideSection {
  heading: string;
  paragraphs: string[];
}

export interface GuideArticle {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  readMinutes: number;
  sections: GuideSection[];
  relatedGuideSlugs: string[];
}

export const GUIDE_ARTICLES: GuideArticle[] = [
  {
    slug: 'how-to-price-used-furniture-ireland',
    title: 'How to price used furniture in Ireland',
    description:
      'A practical guide to pricing sofas, tables, and homeware for local sale — without undercharging or scaring buyers away.',
    publishedAt: '2026-06-01',
    readMinutes: 6,
    relatedGuideSlugs: ['best-places-to-sell-locally-ireland', 'listing-photos-that-sell'],
    sections: [
      {
        heading: 'Start with replacement cost, then adjust down',
        paragraphs: [
          'Check what a similar item costs new from IKEA, Harvey Norman, or DFS, then typically price at 40–60% for good condition, 25–40% for fair wear. Irish buyers expect honest wear — overpricing stale listings is the main reason furniture sits unsold.',
          'Search SellNearby and other local listings for the same item type in your county. Match the median of active listings, not the highest aspirational price.',
        ],
      },
      {
        heading: 'Condition and delivery change the number',
        paragraphs: [
          'Pet-free, smoke-free, and stain-free pieces command a premium — say so in the description. Offer local collection only vs delivery within Dublin/Cork and price accordingly.',
          'If you need the item gone before a move, a sharper price for quick collection beats weeks of waiting for an extra €20.',
        ],
      },
      {
        heading: 'When to accept offers',
        paragraphs: [
          'On community marketplaces, polite offers within 10–15% are normal. Counter once with your floor price. Serious buyers in Ireland often collect the same day if the price feels fair.',
        ],
      },
    ],
  },
  {
    slug: 'best-places-to-sell-locally-ireland',
    title: 'Best places to sell locally in Ireland',
    description:
      'Where Irish sellers get the best results — community marketplaces, local groups, and why hyper-local beats national classifieds for everyday items.',
    publishedAt: '2026-06-10',
    readMinutes: 5,
    relatedGuideSlugs: ['how-to-price-used-furniture-ireland', 'selling-safely-face-to-face-ireland'],
    sections: [
      {
        heading: 'Why local beats national for everyday items',
        paragraphs: [
          'Furniture, bikes, and prams are awkward to ship. Irish buyers prefer collecting within 15–30 km. A community marketplace like SellNearby surfaces nearby listings without commission — keeping more money in your pocket than national platforms with seller fees.',
          'DoneDeal and Adverts.ie remain strong for cars and high-ticket items, but for neighbour-to-neighbour trades, local discovery and trust matter more than nationwide reach.',
        ],
      },
      {
        heading: 'Where to list first',
        paragraphs: [
          'Start with one clear listing on SellNearby — good photos, fair price, accurate area. Share the link in your local WhatsApp or Facebook community group if rules allow, directing people to the platform for messaging.',
          'Avoid duplicating the same listing across five groups with different prices — it erodes trust when buyers compare screenshots.',
        ],
      },
      {
        heading: 'Timing your listing',
        paragraphs: [
          'Thursday evening and Sunday afternoon are peak browsing times in Ireland. List before the weekend if you want same-week collections. Seasonal items (garden furniture, school uniforms) go live 2–3 weeks before demand peaks.',
        ],
      },
    ],
  },
  {
    slug: 'listing-photos-that-sell',
    title: 'How to take listing photos that sell',
    description:
      'Simple photography tips for Irish sellers — daylight, angles, and honesty that help your listing stand out on mobile.',
    publishedAt: '2026-06-18',
    readMinutes: 4,
    relatedGuideSlugs: ['how-to-price-used-furniture-ireland', 'best-places-to-sell-locally-ireland'],
    sections: [
      {
        heading: 'Light and background',
        paragraphs: [
          'Irish daylight near a window beats flash every time. Clear clutter from the background — a plain wall or garden fence looks more trustworthy than a messy garage, even for garage-sale items.',
          'Take landscape photos on your phone; they display better in browse grids. First image is your shop window — show the whole item, not a cropped corner.',
        ],
      },
      {
        heading: 'Show flaws honestly',
        paragraphs: [
          'Include one close-up of any scratch, stain, or wear. Buyers who arrive expecting mint condition and find damage walk away — wasting everyone\'s time. Honest photos reduce no-shows.',
          'For electronics, photograph the screen on, serial label, and included accessories in one collage-style set if your phone supports it.',
        ],
      },
      {
        heading: 'Scale and context',
        paragraphs: [
          'Place a familiar object (A4 sheet, mug, or tape measure) beside smaller items so buyers judge size correctly. For furniture, one photo in the room shows scale better than empty-floor shots alone.',
        ],
      },
    ],
  },
  {
    slug: 'selling-safely-face-to-face-ireland',
    title: 'Selling safely face-to-face in Ireland',
    description:
      'Meet-up checklist for Irish sellers and buyers — public places, payments, and red flags to avoid.',
    publishedAt: '2026-06-25',
    readMinutes: 7,
    relatedGuideSlugs: ['best-places-to-sell-locally-ireland'],
    sections: [
      {
        heading: 'Choose public, busy meet-up spots',
        paragraphs: [
          'Shopping centre car parks, supermarket entrances, and café forecourts across Ireland work well — especially daytime. Avoid home visits for first-time buyers unless you already feel comfortable.',
          'Tell a friend where you are going and share the buyer\'s platform username. Keep messaging on SellNearby until you trust the person.',
        ],
      },
      {
        heading: 'Payments and holds',
        paragraphs: [
          'Cash on collection is still common for local trades. Count it before handing over the item. Be wary of overpayment scams or requests to use unusual transfer apps.',
          'Never send security deposits or shipping fees off-platform for "couriers" you did not arrange yourself — a frequent scam pattern in Irish classifieds.',
        ],
      },
      {
        heading: 'Red flags',
        paragraphs: [
          'Pressure to complete off-platform, refusal to meet in person, or vague locations ("somewhere in Dublin") are warning signs. Use the Report button if something feels wrong — it protects the whole community.',
        ],
      },
    ],
  },
];

export function getGuideBySlug(slug: string): GuideArticle | undefined {
  return GUIDE_ARTICLES.find((guide) => guide.slug === slug);
}

export function buildGuidePath(slug: string): string {
  return `/guides/${encodeURIComponent(slug)}`;
}
