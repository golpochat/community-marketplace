import Link from 'next/link';

import { Button } from '@community-marketplace/ui';

import { ContentPageShell } from '@/components/public/content-page-shell';
import { IRISH_COUNTIES, buildLocalCountyPath } from '@/lib/seo/content/counties';
import { publicPageMetadata } from '@/lib/seo/canonical';

export const metadata = publicPageMetadata({
  title: 'Sell locally in Ireland',
  description:
    'County-by-county guides for selling safely on SellNearby — meet-up tips, local browse links, and community marketplace advice.',
  path: '/local',
});

export default function LocalHubPage() {
  return (
    <ContentPageShell
      title="Sell safely in your county"
      subtitle="Local tips, public meet-up advice, and browse links for all 26 counties in Ireland."
    >
      <p>
        Hyper-local selling works best when buyers know you are nearby and you meet in safe, busy
        places. Pick your county for tailored tips and a direct link to local listings.
      </p>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {IRISH_COUNTIES.map((county) => (
          <li key={county.slug}>
            <Link
              href={buildLocalCountyPath(county.slug)}
              className="block rounded-lg border border-border bg-card px-4 py-3 text-foreground shadow-brand-sm transition-colors hover:border-primary/40 hover:text-primary"
            >
              <span className="font-medium">{county.name}</span>
              <span className="mt-1 block text-sm text-muted-foreground">Selling guide →</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/guides">Read selling guides</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/listings/dublin">Dublin listings</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/safety">Safety &amp; scam protection</Link>
        </Button>
      </div>
    </ContentPageShell>
  );
}
