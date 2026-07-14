'use client';

import { ChatPageShell } from '@/components/chat/chat-page-shell';
import { useAuth } from '@/hooks/use-auth';
import { resolveMarketplaceChatRole } from '@/lib/marketplace-messaging';

export function AccountChatLayout() {
  const { user, session } = useAuth();

  return (
    <ChatPageShell
      currentUserId={user?.id ?? ''}
      accessToken={session?.accessToken}
      role={resolveMarketplaceChatRole(user?.role)}
    />
  );
}
