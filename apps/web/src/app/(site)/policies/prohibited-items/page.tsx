import Link from 'next/link';

import { ContentPageShell } from '@/components/public/content-page-shell';
import { publicPageMetadata } from '@/lib/seo/canonical';

export const metadata = publicPageMetadata({
  title: 'Prohibited Items Policy',
  description:
    'What you cannot sell on SellNearby — alcohol, pork, adult items, gambling, intoxicants, weapons, and illegal goods.',
  path: '/policies/prohibited-items',
});

export default function ProhibitedItemsPolicyPage() {
  return (
    <ContentPageShell
      title="Prohibited items policy"
      subtitle="SellNearby is a safe, family-friendly marketplace. Certain items are not allowed."
      actions={
        <>
          <Link
            href="/community-rules"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Community rules
          </Link>
          <Link
            href="/safety"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Safety &amp; scam protection
          </Link>
        </>
      }
      showFooterActions={false}
    >
      <h2 className="text-xl font-semibold">What items are not allowed?</h2>
      <p>
        To protect our community, the following categories are prohibited. Listings that violate
        this policy may be rejected, removed, or lead to account restrictions.
      </p>

      <h3 className="mt-6 text-lg font-semibold">Faith &amp; community standards</h3>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Alcohol</strong> — beer, wine, spirits, gift sets, homebrew kits
        </li>
        <li>
          <strong>Pork</strong> — bacon, ham, sausages, lard, pork snacks
        </li>
        <li>
          <strong>Adult</strong> — sex toys, pornographic material, explicit content
        </li>
        <li>
          <strong>Gambling</strong> — casino equipment, slot machines, betting tokens, lottery
          resale
        </li>
        <li>
          <strong>Intoxicants</strong> — drugs, vapes, e-cigarettes, shisha, tobacco, unverified CBD
        </li>
      </ul>

      <h3 className="mt-6 text-lg font-semibold">Illegal in Ireland</h3>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Weapons</strong> — firearms, ammunition, combat knives, pepper spray, tasers
        </li>
        <li>
          <strong>Drugs</strong> — cannabis (non-medical), controlled substances, paraphernalia
        </li>
        <li>
          <strong>Stolen / counterfeit</strong> — fake designer goods, fake documents, removed
          serial numbers
        </li>
        <li>
          <strong>Hazardous</strong> — chemicals, explosives, fireworks
        </li>
      </ul>

      <h3 className="mt-6 text-lg font-semibold">Restricted (may need review)</h3>
      <p>
        Some categories are allowed but always reviewed before going live — for example perfumes,
        herbal/wellness products, supplements, and empty collectible bottles. Describe items
        accurately and avoid medical or prescription claims.
      </p>

      <h3 className="mt-6 text-lg font-semibold">Prohibited services</h3>
      <p>
        Escort or adult entertainment, gambling services, interest-based finance, money transfer,
        crypto trading desks, and academic cheating services are not allowed.
      </p>

      <h3 className="mt-6 text-lg font-semibold">How we enforce this</h3>
      <ul className="list-disc space-y-2 pl-5">
        <li>Automated keyword and image-filename checks on listing create and submit</li>
        <li>Admin review for soft-flagged or restricted-category listings</li>
        <li>Listing removal, warnings, temporary restrictions, or suspension for violations</li>
        <li>Serious illegal activity may be reported to authorities</li>
      </ul>
      <p className="mt-4">
        Prohibited listings cannot be boosted, featured, or sold through platform payments. Reports
        are reviewed within 24–72 hours where possible.
      </p>
      <p className="mt-4 text-sm">
        Questions? See{' '}
        <Link href="/community-rules" className="text-primary underline-offset-4 hover:underline">
          community rules
        </Link>{' '}
        or{' '}
        <Link href="/help" className="text-primary underline-offset-4 hover:underline">
          help
        </Link>
        .
      </p>
    </ContentPageShell>
  );
}
