import Link from 'next/link';

import { Button } from '@community-marketplace/ui';

import { ContentPageShell } from '@/components/public/content-page-shell';
import { ContentHubLinks } from '@/components/seo/content-hub-links';
import { buildLocalCountyPath } from '@/lib/seo/content/counties';
import { SUCCESS_STORIES } from '@/lib/seo/content/success-stories';
import { publicPageMetadata } from '@/lib/seo/canonical';

export const metadata = publicPageMetadata({
  title: 'Success Stories',
  description:
    'Real stories from sellers and buyers using SellNearby across Ireland — quick sales, free finds, and trusted local trades.',
  path: '/success-stories',
});

export default function SuccessStoriesPage() {
  return (
    <ContentPageShell
      showFooterActions={false}
      title="Success stories"
      subtitle="Real wins from neighbours buying and selling locally — Dublin to Galway and beyond."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {SUCCESS_STORIES.map((story) => (
          <article
            key={story.id}
            className="flex flex-col rounded-xl border border-border bg-card p-5 shadow-brand-sm"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold uppercase tracking-wide text-primary">{story.tag}</span>
              <span className="text-muted-foreground">·</span>
              <span className="capitalize text-muted-foreground">{story.role}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{story.itemType}</span>
            </div>
            <blockquote className="mt-3 text-lg font-medium text-foreground">
              &ldquo;{story.quote}&rdquo;
            </blockquote>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{story.summary}</p>
            <footer className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">{story.area}</span>, {story.county}
              </p>
              <p className="font-medium text-primary">{story.outcome}</p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href={buildLocalCountyPath(story.county.toLowerCase())}
                  className="text-primary hover:underline"
                >
                  Sell in {story.county}
                </Link>
                {story.categorySlug ? (
                  <Link
                    href={`/categories/${story.categorySlug}`}
                    className="text-primary hover:underline"
                  >
                    Browse {story.itemType.toLowerCase()}
                  </Link>
                ) : null}
              </div>
            </footer>
          </article>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-muted/30 p-6">
        <h2 className="text-lg font-semibold text-foreground">Write your own success story</h2>
        <p className="mt-2 text-muted-foreground">
          List an item, buy locally, or share SellNearby with a neighbour. Every local trade strengthens
          the community marketplace.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/auth/register?intent=seller">Start selling</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/listings">Browse listings</Link>
          </Button>
        </div>
      </div>

      <div className="mt-12">
        <ContentHubLinks />
      </div>
    </ContentPageShell>
  );
}
