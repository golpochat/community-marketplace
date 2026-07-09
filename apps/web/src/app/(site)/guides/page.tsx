import Link from 'next/link';

import { Button } from '@community-marketplace/ui';

import { ContentPageShell } from '@/components/public/content-page-shell';
import { GUIDE_ARTICLES, buildGuidePath } from '@/lib/seo/content/guides';
import { publicPageMetadata } from '@/lib/seo/canonical';

export const metadata = publicPageMetadata({
  title: 'Selling guides',
  description:
    'Practical guides for buying and selling locally in Ireland — pricing, photos, safety, and where to list.',
  path: '/guides',
});

export default function GuidesHubPage() {
  return (
    <ContentPageShell
      title="Selling guides"
      subtitle="Practical advice for Irish sellers and buyers — no fluff, just what works locally."
      showFooterActions={false}
    >
      <div className="space-y-6">
        {GUIDE_ARTICLES.map((guide) => (
          <article
            key={guide.slug}
            className="rounded-xl border border-border bg-card p-5 shadow-brand-sm"
          >
            <p className="text-xs text-muted-foreground">
              {guide.readMinutes} min read ·{' '}
              {new Date(guide.publishedAt).toLocaleDateString('en-IE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              <Link href={buildGuidePath(guide.slug)} className="hover:text-primary">
                {guide.title}
              </Link>
            </h2>
            <p className="mt-2 text-muted-foreground">{guide.description}</p>
            <Link
              href={buildGuidePath(guide.slug)}
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              Read guide →
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/local">Sell safely by county</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/listings">Browse listings</Link>
        </Button>
      </div>
    </ContentPageShell>
  );
}
