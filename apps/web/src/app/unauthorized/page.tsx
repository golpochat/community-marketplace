import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@community-marketplace/ui';

import { NOINDEX_ROBOTS } from '@/lib/seo/constants';

export const metadata: Metadata = {
  title: 'Unauthorized',
  robots: NOINDEX_ROBOTS,
};

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Access denied</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        You do not have permission to view this page. Sign in with the correct account to continue.
      </p>
      <Button asChild>
        <Link href="/auth/login">Return to login</Link>
      </Button>
    </div>
  );
}
