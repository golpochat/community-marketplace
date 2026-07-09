import Link from 'next/link';

import { Button } from '@community-marketplace/ui';

import { GUIDE_ARTICLES, buildGuidePath } from '@/lib/seo/content/guides';
import { IRISH_COUNTIES, buildLocalCountyPath } from '@/lib/seo/content/counties';

interface ContentHubLinksProps {
  /** Show compact variant for embedding in browse/category footers. */
  variant?: 'full' | 'compact';
}

export function ContentHubLinks({ variant = 'full' }: ContentHubLinksProps) {
  const featuredCounties = IRISH_COUNTIES.slice(0, 6);
  const featuredGuides = GUIDE_ARTICLES.slice(0, 3);

  if (variant === 'compact') {
    return (
      <nav
        aria-label="Explore SellNearby"
        className="rounded-xl border border-border bg-muted/30 p-4 text-sm"
      >
        <p className="font-semibold text-foreground">Explore more</p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
          <li>
            <Link href="/guides" className="hover:text-primary">
              Selling guides
            </Link>
          </li>
          <li>
            <Link href="/local" className="hover:text-primary">
              Sell locally by county
            </Link>
          </li>
          <li>
            <Link href="/success-stories" className="hover:text-primary">
              Success stories
            </Link>
          </li>
          <li>
            <Link href="/safety" className="hover:text-primary">
              Safety tips
            </Link>
          </li>
        </ul>
      </nav>
    );
  }

  return (
    <section className="grid gap-8 md:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-6 shadow-brand-sm">
        <h2 className="text-lg font-semibold text-foreground">Selling guides</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Practical tips for pricing, photos, and safe local trades in Ireland.
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          {featuredGuides.map((guide) => (
            <li key={guide.slug}>
              <Link href={buildGuidePath(guide.slug)} className="text-primary hover:underline">
                {guide.title}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/guides" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          View all guides →
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-brand-sm">
        <h2 className="text-lg font-semibold text-foreground">Sell safely in your county</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Local meet-up tips and browse links for every county in Ireland.
        </p>
        <ul className="mt-4 flex flex-wrap gap-2 text-sm">
          {featuredCounties.map((county) => (
            <li key={county.slug}>
              <Link
                href={buildLocalCountyPath(county.slug)}
                className="rounded-full border border-border bg-background px-3 py-1 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {county.name}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/local" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          All counties →
        </Link>
      </div>

      <div className="md:col-span-2 flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href="/listings">Browse listings</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/success-stories">Read success stories</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/help">Help centre</Link>
        </Button>
      </div>
    </section>
  );
}
