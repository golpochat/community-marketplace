import Link from 'next/link';

import { COMMERCE_PUBLIC_COPY } from '@community-marketplace/utils';

import { ContentPageShell } from '@/components/public/content-page-shell';
import { PLATFORM_SUPPORT_EMAIL } from '@/lib/constants';
import { publicPageMetadata } from '@/lib/seo/canonical';

export const metadata = publicPageMetadata({
  title: 'Privacy Policy',
  description:
    'How SellNearby collects and uses account, listing, and payment data, and how to export or delete your account.',
  path: '/privacy',
});

export default function PrivacyPage() {
  return (
    <ContentPageShell
      title="Privacy policy"
      subtitle="What personal data SellNearby uses, and the rights you can exercise."
    >
      <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
        {COMMERCE_PUBLIC_COPY.legalDraftNotice}
      </p>

      <h2 className="text-xl font-semibold">1. Who is responsible</h2>
      <p>
        SellNearby operates this marketplace. Privacy questions:{' '}
        <a href={`mailto:${PLATFORM_SUPPORT_EMAIL}`} className="text-primary hover:underline">
          {PLATFORM_SUPPORT_EMAIL}
        </a>
        .
      </p>

      <h2 className="text-xl font-semibold">2. What we collect</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Account details: email, display name, phone when you verify it, profile fields you enter.</li>
        <li>Listings, messages, reports, and verification documents you submit.</li>
        <li>Payment records for card checkout (processed by Stripe — we do not store card numbers).</li>
        <li>Device and session data needed to keep you signed in and detect abuse.</li>
        <li>Optional analytics cookies if you accept them — see the{' '}
          <Link href="/cookies" className="text-primary hover:underline">
            cookie policy
          </Link>
          .
        </li>
      </ul>

      <h2 className="text-xl font-semibold">3. Why we use it</h2>
      <p>
        We use this data to run the marketplace (contract), keep the community safe (legitimate
        interests / legal obligation), process card payouts, and — only with consent — measure
        traffic. We do not sell personal data.
      </p>

      <h2 className="text-xl font-semibold">4. Processors</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li>Stripe — card checkout and seller payouts.</li>
        <li>Email delivery (Brevo, SendGrid, or Amazon SES, depending on configuration).</li>
        <li>Cloudflare R2 — listing and profile images.</li>
        <li>Google Analytics or Plausible — only if you accept analytics cookies.</li>
      </ul>

      <h2 className="text-xl font-semibold">5. How long we keep it</h2>
      <p>
        Account and listing data is kept while the account is open. After you request deletion we
        deactivate the account and remove profile details. Payment and invoice records are retained
        where Irish tax and accounting rules require.
      </p>

      <h2 className="text-xl font-semibold">6. Your rights</h2>
      <p>
        You can access a copy of your data and request erasure from{' '}
        <Link href="/account/settings" className="text-primary hover:underline">
          account settings
        </Link>
        , or by emailing {PLATFORM_SUPPORT_EMAIL}. You may also object to optional analytics via the
        cookie banner.
      </p>

      <h2 className="text-xl font-semibold">7. Safety and legal pages</h2>
      <p>
        Meet-up safety is covered on{' '}
        <Link href="/safety" className="text-primary hover:underline">
          Safety
        </Link>
        . Card versus cash rules are in the{' '}
        <Link href="/terms" className="text-primary hover:underline">
          terms
        </Link>
        . {COMMERCE_PUBLIC_COPY.disputeReview}
      </p>
    </ContentPageShell>
  );
}
