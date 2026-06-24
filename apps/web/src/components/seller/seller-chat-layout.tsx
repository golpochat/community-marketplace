'use client';

import { ChatPageClient } from '@/components/chat/chat-page-client';
import { useAuth } from '@/hooks/use-auth';

export function SellerChatLayout() {
  const { user, session } = useAuth();

  return (
    <ChatPageClient
      currentUserId={user?.id ?? 'seller-demo'}
      accessToken={session?.accessToken}
      role="SELLER"
    />
  );
}
