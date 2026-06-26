'use client';

import Link from 'next/link';

import { Button } from '@community-marketplace/ui';
import { useAuth } from '@/hooks/use-auth';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

interface ChatButtonProps {
  listingId: string;
  sellerId: string;
}

export function ChatButton({ listingId, sellerId }: ChatButtonProps) {
  const { isAuthenticated, dashboardPath } = useAuth();

  if (!isAuthenticated) {
    return (
      <span className="block w-full" title="Log in to contact this seller">
        <Button className="w-full" disabled>
          Message seller
        </Button>
      </span>
    );
  }

  const chatPath = dashboardPath?.includes('seller') ? '/seller/chat' : '/buyer/chat';

  return (
    <Link href={`${chatPath}?listing=${listingId}&seller=${sellerId}`} className="block w-full">
      <Button className="w-full">Message seller</Button>
    </Link>
  );
}

export function ChatLoginHint() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return null;

  return (
    <p className="text-xs text-gray-500">
      <Link href={WEB_APP_ROUTES.login} className="font-medium text-primary hover:underline">
        Sign in
      </Link>
      {' or '}
      <Link href={WEB_APP_ROUTES.register} className="font-medium text-primary hover:underline">
        join
      </Link>
      {' to message sellers.'}
    </p>
  );
}
