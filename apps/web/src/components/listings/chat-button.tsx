'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from '@community-marketplace/ui';

import { useAuth } from '@/hooks/use-auth';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

interface ChatButtonProps {
  listingId: string;
  sellerId: string;
}

export function ChatButton({ listingId, sellerId }: ChatButtonProps) {
  const { isAuthenticated, dashboardPath } = useAuth();
  const pathname = usePathname();

  const loginHref = `${WEB_APP_ROUTES.login}?returnUrl=${encodeURIComponent(pathname)}`;

  if (!isAuthenticated) {
    return (
      <Link href={loginHref} className="block w-full">
        <Button type="button" variant="outline" className="w-full">
          Message seller
        </Button>
      </Link>
    );
  }

  const chatPath = dashboardPath?.includes('seller') ? '/seller/chat' : '/buyer/chat';

  return (
    <Link href={`${chatPath}?listing=${listingId}&seller=${sellerId}`} className="block w-full">
      <Button type="button" variant="outline" className="w-full">
        Message seller
      </Button>
    </Link>
  );
}

export function ChatLoginHint() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return null;

  return (
    <p className="text-xs text-muted-foreground">
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
