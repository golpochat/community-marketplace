'use client';

import { ChatPageClient } from '@/components/chat/chat-page-client';

/** Buyer chat — wire auth token from session when available */
export default function BuyerChatPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Messages</h1>
      <ChatPageClient currentUserId="buyer-demo" role="BUYER" />
    </div>
  );
}
