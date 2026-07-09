import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@community-marketplace/ui';

import { NOINDEX_ROBOTS } from '@/lib/seo/constants';

export const metadata: Metadata = {
  title: 'Messages',
  robots: NOINDEX_ROBOTS,
};

export default function ChatPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-foreground">Messages</h1>
      <p className="mt-2 text-muted-foreground">
        Chat is available from your role dashboard after signing in.
      </p>
      <div className="mt-6 flex gap-4">
        <Button asChild>
          <Link href="/buyer/dashboard/chat">Buyer messages</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/seller/dashboard/chat">Seller messages</Link>
        </Button>
      </div>
    </div>
  );
}
