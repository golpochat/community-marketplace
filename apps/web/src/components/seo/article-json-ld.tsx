import type { GuideArticle } from '@/lib/seo/content/guides';
import { absoluteUrl } from '@/lib/seo/canonical';
import { buildGuidePath } from '@/lib/seo/content/guides';

import { JsonLd } from './json-ld';

interface ArticleJsonLdProps {
  article: GuideArticle;
}

export function ArticleJsonLd({ article }: ArticleJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'SellNearby.ie',
    },
    publisher: {
      '@type': 'Organization',
      name: 'SellNearby.ie',
    },
    mainEntityOfPage: absoluteUrl(buildGuidePath(article.slug)),
  };

  return <JsonLd data={data} />;
}
