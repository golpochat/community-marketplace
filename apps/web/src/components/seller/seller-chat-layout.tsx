'use client';

import { ChatPageShell } from '@/components/chat/chat-page-shell';
import { useAuth } from '@/hooks/use-auth';

export function SellerChatLayout() {
  const { user, session } = useAuth();

  return (
    <ChatPageShell
      currentUserId={user?.id ?? 'seller-demo'}
      accessToken={session?.accessToken}
      role="SELLER"
    />
  );
}
