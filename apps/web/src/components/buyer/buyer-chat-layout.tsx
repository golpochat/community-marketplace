'use client';

import { ChatPageClient } from '@/components/chat/chat-page-client';
import { useAuth } from '@/hooks/use-auth';

export function BuyerChatLayout() {
  const { user, session } = useAuth();

  return (
    <ChatPageClient
      currentUserId={user?.id ?? 'buyer-demo'}
      accessToken={session?.accessToken}
      role="BUYER"
    />
  );
}
