import Link from 'next/link';

import { Button } from '@community-marketplace/ui';
import { formatCurrency } from '@community-marketplace/utils';

export default function HomePage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Community Marketplace
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Discover local listings starting from {formatCurrency(0)} — connect with your community.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/listings">
            <Button>Browse Listings</Button>
          </Link>
          <Link href="/auth/register">
            <Button variant="secondary">Join Now</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
