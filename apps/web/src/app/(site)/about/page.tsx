import Link from 'next/link';

import { Button } from '@community-marketplace/ui';
import { APP_NAME, PLATFORM_COUNTRY_NAME } from '@community-marketplace/config';

import { FounderCallout } from '@/components/public/founder-story-section';

export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-foreground">About {APP_NAME}</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        {APP_NAME} is Ireland&apos;s trusted community marketplace — built so neighbours can buy and
        sell safely without scams, long-distance hassle, or anonymous classifieds noise.
      </p>

      <div className="mt-8">
        <FounderCallout />
      </div>

      <p className="mt-6 text-muted-foreground leading-relaxed">
        Hi, I&apos;m Sujan. I personally moderate this marketplace to keep it safe for our
        community. We focus on local areas, verified sellers, and simple tools that work on your
        phone.
      </p>

      <p className="mt-4 text-muted-foreground">
        Read our{' '}
        <Link href="/safety" className="text-primary hover:underline">
          safety guide
        </Link>
        ,{' '}
        <Link href="/community-rules" className="text-primary hover:underline">
          community rules
        </Link>
        , and{' '}
        <Link href="/success-stories" className="text-primary hover:underline">
          success stories
        </Link>{' '}
        from sellers across {PLATFORM_COUNTRY_NAME}.
      </p>

      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/listings">
          <Button>Browse listings</Button>
        </Link>
        <Link href="/auth/register">
          <Button variant="secondary">Join the community</Button>
        </Link>
      </div>
    </div>
  );
}
