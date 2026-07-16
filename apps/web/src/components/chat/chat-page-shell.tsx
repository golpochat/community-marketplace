'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { LoadingState } from '@/components/LoadingState';
import { ChatPageClient } from '@/components/chat/chat-page-client';
import type { MarketplaceChatRole } from '@/lib/marketplace-messaging';

interface ChatPageShellProps {
  currentUserId: string;
  accessToken?: string;
  role: MarketplaceChatRole;
}

function ChatPageWithParams({ currentUserId, accessToken, role }: ChatPageShellProps) {
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listing') ?? undefined;
  const sellerId = searchParams.get('seller') ?? undefined;
  const threadId = searchParams.get('thread') ?? undefined;

  return (
    <ChatPageClient
      currentUserId={currentUserId}
      accessToken={accessToken}
      role={role}
      listingId={listingId}
      sellerId={sellerId}
      initialThreadId={threadId}
    />
  );
}

export function ChatPageShell(props: ChatPageShellProps) {
  return (
    <Suspense fallback={<LoadingState />}>
      <ChatPageWithParams {...props} />
    </Suspense>
  );
}
