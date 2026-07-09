import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { Button } from '@community-marketplace/ui';

import { ContentHubLinks } from '@/components/seo/content-hub-links';
import {
  IRISH_COUNTIES,
  buildLocalCountyPath,
  getCountyBySlug,
} from '@/lib/seo/content/counties';
import { buildGuidePath } from '@/lib/seo/content/guides';
import { publicPageMetadata } from '@/lib/seo/canonical';
import { SITE_PAGE_CLASS } from '@/lib/page-layout';

interface LocalCountyPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return IRISH_COUNTIES.map((county) => ({ slug: county.slug }));
}

export async function generateMetadata({ params }: LocalCountyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const county = getCountyBySlug(slug);
  if (!county) return { title: 'County not found' };

  return publicPageMetadata({
    title: `How to sell safely in ${county.name}`,
    description: `Local selling tips for ${county.name} — public meet-ups, pricing advice, and browse listings near you on SellNearby.`,
    path: buildLocalCountyPath(county.slug),
  });
}

const SAFETY_CHECKLIST = [
  'Meet in busy public places — shopping centres, supermarket car parks, or main-street cafés.',
  'Keep all messaging on SellNearby until you trust the buyer or seller.',
  'Inspect items before paying; count cash on collection for local trades.',
  'Never pay deposits to unknown couriers or send money off-platform.',
  'Report suspicious behaviour using the Report button — it protects everyone.',
] as const;

export default async function LocalCountyPage({ params }: LocalCountyPageProps) {
  const { slug } = await params;
  const county = getCountyBySlug(slug);
  if (!county) notFound();

  const browseHref = `/listings?area=${encodeURIComponent(county.browseArea)}`;

  return (
    <div className={SITE_PAGE_CLASS}>
      <article className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold text-foreground">How to sell safely in {county.name}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{county.intro}</p>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-foreground">Local tips for {county.name}</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
            {county.localTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-foreground">Safety checklist</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-muted-foreground">
            {SAFETY_CHECKLIST.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            Read our full{' '}
            <Link href="/safety" className="text-primary hover:underline">
              safety &amp; scam protection guide
            </Link>{' '}
            and{' '}
            <Link href={buildGuidePath('selling-safely-face-to-face-ireland')} className="text-primary hover:underline">
              face-to-face selling checklist
            </Link>
            .
          </p>
        </section>

        <section className="mt-10 rounded-xl border border-border bg-card p-6 shadow-brand-sm">
          <h2 className="text-xl font-semibold text-foreground">Browse listings in {county.name}</h2>
          <p className="mt-2 text-muted-foreground">
            Discover items from verified local sellers in {county.name}. No commission — list free,
            sell to neighbours.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={browseHref}>Browse {county.name} listings</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/register?intent=seller">Start selling</Link>
            </Button>
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/local">All counties</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/guides">Selling guides</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/success-stories">Success stories</Link>
          </Button>
        </div>
      </article>

      <div className="mx-auto mt-16 max-w-3xl">
        <ContentHubLinks variant="compact" />
      </div>
    </div>
  );
}
