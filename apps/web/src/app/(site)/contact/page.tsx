import Link from 'next/link';

import { ContentPageShell } from '@/components/public/content-page-shell';
import { PILOT_FEEDBACK_FORM_URL, PLATFORM_SUPPORT_EMAIL } from '@/lib/constants';
import { publicPageMetadata } from '@/lib/seo/canonical';

const pilotFeedbackMailto = `mailto:${PLATFORM_SUPPORT_EMAIL}?subject=${encodeURIComponent('[Pilot feedback]')}`;

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

      <h2 className="mt-8 text-xl font-semibold text-foreground">Pilot participants</h2>
      <p className="mt-3">
        Thank you for testing SellNearby early. The fastest way to help us improve is the short
        feedback form — use it anytime something feels confusing or broken.
      </p>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        {PILOT_FEEDBACK_FORM_URL ? (
          <li>
            <a
              href={PILOT_FEEDBACK_FORM_URL}
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Pilot feedback form
            </a>{' '}
            (about 2 minutes)
          </li>
        ) : (
          <li>
            <strong>Pilot feedback form</strong> — link is in your invite email (or ask us to resend
            it)
          </li>
        )}
        <li>
          Bugs and account issues:{' '}
          <a href={pilotFeedbackMailto} className="text-primary hover:underline">
            email support with subject &ldquo;[Pilot feedback]&rdquo;
          </a>{' '}
          — include what you clicked and a screenshot if you can
        </li>
        <li>
          Safety on a specific listing: use <strong>Report listing</strong> on that page so
          moderation can act quickly
        </li>
      </ul>

      <p className="mt-4">
        For urgent safety issues outside a listing, use <strong>Report user</strong> on the relevant
        profile or email us directly.
      </p>
      <p className="mt-4">
        Read our <Link href="/safety" className="text-primary hover:underline">safety guide</Link>{' '}
        before meeting buyers or sellers in person.
      </p>
    </ContentPageShell>
  );
}
