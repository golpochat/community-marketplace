import Link from 'next/link';

import { ContentPageShell } from '@/components/public/content-page-shell';
import { PLATFORM_SUPPORT_EMAIL } from '@/lib/constants';
import { publicPageMetadata } from '@/lib/seo/canonical';

export const metadata = publicPageMetadata({
  title: 'Contact',
  description: 'Get in touch with the SellNearby team for support, feedback, or partnership enquiries.',
  path: '/contact',
});

export default function ContactPage() {
  return (
    <ContentPageShell
      title="Contact"
      subtitle="Questions, feedback, or safety concerns — we read every message."
    >
      <p>
        Email:{' '}
        <a href={`mailto:${PLATFORM_SUPPORT_EMAIL}`} className="text-primary hover:underline">
          {PLATFORM_SUPPORT_EMAIL}
        </a>
      </p>
      <p className="mt-4">
        For urgent safety issues, use <strong>Report listing</strong> or{' '}
        <strong>Report user</strong> on the relevant page so our moderation queue can act quickly.
      </p>
      <p className="mt-4">
        Read our <Link href="/safety" className="text-primary hover:underline">safety guide</Link>{' '}
        before meeting buyers or sellers in person.
      </p>
    </ContentPageShell>
  );
}
