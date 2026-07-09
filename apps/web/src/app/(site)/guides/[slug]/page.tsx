import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { Button } from '@community-marketplace/ui';

import { ArticleJsonLd } from '@/components/seo/article-json-ld';
import { ContentHubLinks } from '@/components/seo/content-hub-links';
import { GUIDE_ARTICLES, buildGuidePath, getGuideBySlug } from '@/lib/seo/content/guides';
import { publicPageMetadata } from '@/lib/seo/canonical';
import { SITE_PAGE_CLASS } from '@/lib/page-layout';

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return GUIDE_ARTICLES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return { title: 'Guide not found' };

  return {
    ...publicPageMetadata({
      title: guide.title,
      description: guide.description,
      path: buildGuidePath(guide.slug),
    }),
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const related = guide.relatedGuideSlugs
    .map((relatedSlug) => getGuideBySlug(relatedSlug))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className={SITE_PAGE_CLASS}>
      <ArticleJsonLd article={guide} />
      <article className="mx-auto max-w-3xl">
        <p className="text-sm text-muted-foreground">
          {guide.readMinutes} min read ·{' '}
          {new Date(guide.publishedAt).toLocaleDateString('en-IE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">{guide.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{guide.description}</p>

        <div className="mt-10 space-y-8 text-muted-foreground">
          {guide.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-xl font-semibold text-foreground">{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="mt-3 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        {related.length > 0 ? (
          <aside className="mt-12 rounded-xl border border-border bg-muted/30 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Related guides
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link href={buildGuidePath(item.slug)} className="text-primary hover:underline">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/listings">Browse listings</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/guides">All guides</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/safety">Safety tips</Link>
          </Button>
        </div>
      </article>

      <div className="mx-auto mt-16 max-w-3xl">
        <ContentHubLinks variant="compact" />
      </div>
    </div>
  );
}
