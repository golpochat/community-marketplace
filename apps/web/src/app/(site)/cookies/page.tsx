import Link from 'next/link';

import { COMMERCE_PUBLIC_COPY } from '@community-marketplace/utils';

import { ContentPageShell } from '@/components/public/content-page-shell';
import { publicPageMetadata } from '@/lib/seo/canonical';

export const metadata = publicPageMetadata({
  title: 'Cookie Policy',
  description: 'Necessary cookies for sign-in, and optional analytics cookies on SellNearby.',
  path: '/cookies',
});

export default function CookiesPage() {
  return (
    <ContentPageShell
      title="Cookie policy"
      subtitle="What cookies SellNearby uses and how you can change analytics consent."
    >
      <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
        {COMMERCE_PUBLIC_COPY.legalDraftNotice}
      </p>

      <h2 className="text-xl font-semibold">Necessary cookies</h2>
      <p>
        These keep you signed in and protect forms (session, CSRF). The site cannot work without
        them. They are not used for marketing.
      </p>

      <h2 className="text-xl font-semibold">Analytics cookies</h2>
      <p>
        If you choose Accept analytics, we may load Google Analytics or Plausible to understand
        which public pages are used. This is optional. Choose Necessary only to skip it.
      </p>

      <h2 className="text-xl font-semibold">How to change your choice</h2>
      <p>
        The cookie banner appears until you choose. Clearing this site&apos;s data in your browser
        will show the banner again. Details on personal data are in the{' '}
        <Link href="/privacy" className="text-primary hover:underline">
          privacy policy
        </Link>
        .
      </p>
    </ContentPageShell>
  );
}
