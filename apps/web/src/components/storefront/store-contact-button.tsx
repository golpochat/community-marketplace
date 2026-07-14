'use client';

import Link from 'next/link';

import { Button } from '@community-marketplace/ui';

import { useAuth } from '@/hooks/use-auth';
import { buildListingMessageHref } from '@/lib/marketplace-messaging';
import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

interface StoreContactButtonProps {
  sellerId: string;
  listingId?: string;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StoreContactButton({
  sellerId,
  listingId,
  label = 'Message seller',
  icon,
  className,
}: StoreContactButtonProps) {
  const { isAuthenticated, user } = useAuth();

  if (!listingId) {
    return (
      <Button className={className} disabled title="No active listings to message about">
        {icon}
        {label}
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Link href={WEB_APP_ROUTES.login} className={className}>
        <Button className="w-full">{label}</Button>
      </Link>
    );
  }

  if (user?.id === sellerId) {
    return null;
  }

  return (
    <Link
      href={buildListingMessageHref(listingId, sellerId)}
      className={className ?? 'block w-full'}
    >
      <Button className="w-full">
        {icon}
        {label}
      </Button>
    </Link>
  );
}
