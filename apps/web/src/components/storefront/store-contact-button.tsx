'use client';

import Link from 'next/link';

import { Button } from '@community-marketplace/ui';

import { useAuth } from '@/hooks/use-auth';
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
  const { isAuthenticated, dashboardPath } = useAuth();

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

  const chatPath = dashboardPath?.includes('seller') ? '/seller/chat' : '/buyer/chat';

  return (
    <Link
      href={`${chatPath}?listing=${listingId}&seller=${sellerId}`}
      className={className ?? 'block w-full'}
    >
      <Button className="w-full">
        {icon}
        {label}
      </Button>
    </Link>
  );
}
