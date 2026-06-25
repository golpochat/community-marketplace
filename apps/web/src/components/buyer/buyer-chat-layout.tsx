'use client';

import { ChatPageShell } from '@/components/chat/chat-page-shell';
import { useAuth } from '@/hooks/use-auth';

export function BuyerChatLayout() {
  const { user, session } = useAuth();

  return (
    <ChatPageShell
      currentUserId={user?.id ?? 'buyer-demo'}
      accessToken={session?.accessToken}
      role="BUYER"
    />
  );
}
