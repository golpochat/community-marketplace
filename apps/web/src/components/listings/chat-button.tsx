'use client';

import Link from 'next/link';

import { Button } from '@community-marketplace/ui';
import { useAuth } from '@/hooks/use-auth';

interface ChatButtonProps {
  listingId: string;
  sellerId: string;
}

export function ChatButton({ listingId, sellerId }: ChatButtonProps) {
  const { isAuthenticated, dashboardPath } = useAuth();

  if (!isAuthenticated) {
    return (
      <Link href={`/auth/login?redirect=/listings/${listingId}`}>
        <Button>Sign in to chat</Button>
      </Link>
    );
  }

  const chatPath = dashboardPath?.includes('seller') ? '/seller/chat' : '/buyer/chat';

  return (
    <Link href={`${chatPath}?listing=${listingId}&seller=${sellerId}`}>
      <Button>Contact seller</Button>
    </Link>
  );
}
