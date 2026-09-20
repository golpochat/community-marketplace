import Link from 'next/link';

import { COMMERCE_PUBLIC_COPY } from '@community-marketplace/utils';

import { ContentPageShell } from '@/components/public/content-page-shell';
import { PLATFORM_SUPPORT_EMAIL } from '@/lib/constants';
import { publicPageMetadata } from '@/lib/seo/canonical';

export const metadata = publicPageMetadata({
  title: 'Terms of Service',
  description:
    'SellNearby terms for listing, messaging, optional card checkout, and card-sale dispute review.',
  path: '/terms',
});

export default function TermsPage() {
  return (
    <ContentPageShell
      title="Terms of service"
      subtitle="How listing, chat, and optional card checkout work on SellNearby."
    >
      <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
        {COMMERCE_PUBLIC_COPY.legalDraftNotice}
      </p>

      <h2 className="text-xl font-semibold">1. The service</h2>
      <p>
        SellNearby is a community classifieds marketplace for Ireland. You may list items, message
        other members, and optionally complete a card checkout. Listing and messaging are free.
      </p>

      <h2 className="text-xl font-semibold">2. Accounts</h2>
      <p>
        You must provide accurate details and keep your login safe. We may suspend or remove
        accounts that break these terms or our{' '}
        <Link href="/community-rules" className="text-primary hover:underline">
          community rules
        </Link>
        .
      </p>

      <h2 className="text-xl font-semibold">3. Listings</h2>
      <p>
        List only legal items you are entitled to sell. Descriptions and photos must be accurate.
        See the{' '}
        <Link href="/policies/prohibited-items" className="text-primary hover:underline">
          prohibited items policy
        </Link>
        .
      </p>

      <h2 className="text-xl font-semibold">4. Payments — card vs cash</h2>
      <p>
        Card checkout is optional. When a buyer pays by card, the seller pays a seller service fee
        on that payout. Buyers pay the listed price. Cash or collection arranged in chat has no
        seller service fee.
      </p>
      <p>{COMMERCE_PUBLIC_COPY.disputeReview}</p>
      <p>
        Stripe processes card payments. Sellers who want card payouts must complete Stripe Connect
        onboarding. SellNearby does not hold funds as escrow.
      </p>

      <h2 className="text-xl font-semibold">5. Disputes on card sales</h2>
      <p>
        Open a dispute from the purchase record. We aim to review card-checkout disputes within 48
        hours. Meetup, cash, and off-platform sales have no platform refund path.
      </p>

      <h2 className="text-xl font-semibold">6. Liability</h2>
      <p>
        We moderate listings and provide reporting tools. We do not guarantee that a buyer or seller
        will complete a trade, and we are not a party to cash or collection deals arranged in chat.
      </p>

      <h2 className="text-xl font-semibold">7. Contact</h2>
      <p>
        Questions:{' '}
        <a href={`mailto:${PLATFORM_SUPPORT_EMAIL}`} className="text-primary hover:underline">
          {PLATFORM_SUPPORT_EMAIL}
        </a>
        . Privacy rights are explained in the{' '}
        <Link href="/privacy" className="text-primary hover:underline">
          privacy policy
        </Link>
        .
      </p>
    </ContentPageShell>
  );
}
