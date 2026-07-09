import { publicPageMetadata } from '@/lib/seo/canonical';
import { HELP_FAQ_ITEMS } from '@/lib/seo/help-faq';

import { FaqJsonLd } from '@/components/seo/faq-json-ld';

export const metadata = publicPageMetadata({
  title: 'Help Centre',
  description: 'Answers to common questions about buying, selling, and staying safe on SellNearby.',
  path: '/help',
});

export default function HelpPage() {
  return (
    <>
      <FaqJsonLd />
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground">Help centre</h1>
        <p className="mt-2 text-muted-foreground">Find answers to common questions about buying and selling.</p>
        <dl className="mt-10 space-y-8">
          {HELP_FAQ_ITEMS.map((item) => (
            <div key={item.question}>
              <dt className="text-lg font-semibold text-foreground">{item.question}</dt>
              <dd className="mt-2 text-muted-foreground">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
