import Link from 'next/link';

import { Button } from '@community-marketplace/ui';
import { APP_NAME, PLATFORM_COUNTRY_NAME } from '@community-marketplace/config';

export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900">About {APP_NAME}</h1>
      <p className="mt-4 text-lg text-gray-600">
        {APP_NAME} is a community-driven marketplace connecting buyers and sellers across{' '}
        {PLATFORM_COUNTRY_NAME}. We believe in local trade, trusted neighbours, and sustainable
        reuse.
      </p>
      <p className="mt-4 text-gray-600">
        Our platform provides secure messaging, verified seller badges, and safe payment options so
        you can buy and sell with confidence.
      </p>
      <div className="mt-8 flex gap-4">
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
