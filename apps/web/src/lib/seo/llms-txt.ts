import { APP_NAME } from '@community-marketplace/config';

import { GUIDE_ARTICLES, buildGuidePath } from '@/lib/seo/content/guides';
import { IRISH_COUNTIES, buildLocalCountyPath } from '@/lib/seo/content/counties';
import { LISTING_LOCATIONS, buildListingLocationPath } from '@/lib/seo/content/locations';
import { getAppUrl } from '@/lib/site-url';

function line(text = '') {
  return `${text}\n`;
}

export function buildLlmsTxt(): string {
  const base = getAppUrl();
  const sections = [
    line(`# ${APP_NAME}`),
    line('> Ireland\'s community marketplace — buy and sell locally with no commission.'),
    line('> Primary audience: Irish residents buying and selling second-hand goods locally.'),
    line(),
    line('## Core marketplace'),
    line(`- Browse listings: ${base}/listings`),
    line(`- Start selling: ${base}/auth/register?intent=seller`),
    line(`- Help centre: ${base}/help`),
    line(`- Safety guide: ${base}/safety`),
    line(),
    line('## Selling guides'),
    ...GUIDE_ARTICLES.map((guide) => line(`- ${guide.title}: ${base}${buildGuidePath(guide.slug)}`)),
    line(),
    line('## Major city listing pages'),
    ...LISTING_LOCATIONS.map((location) =>
      line(`- ${location.name}: ${base}${buildListingLocationPath(location.slug)}`),
    ),
    line(),
    line('## County selling guides'),
    ...IRISH_COUNTIES.slice(0, 10).map((county) =>
      line(`- ${county.name}: ${base}${buildLocalCountyPath(county.slug)}`),
    ),
    line(`- All counties: ${base}/local`),
    line(),
    line('## Policies'),
    line(`- Terms: ${base}/terms`),
    line(`- Privacy: ${base}/privacy`),
    line(`- Community rules: ${base}/community-rules`),
    line(`- Prohibited items: ${base}/policies/prohibited-items`),
    line(),
    line('## Optional'),
    line(`- Sitemap: ${base}/sitemap.xml`),
    line(`- Contact: ${base}/contact`),
  ];

  return sections.join('');
}
