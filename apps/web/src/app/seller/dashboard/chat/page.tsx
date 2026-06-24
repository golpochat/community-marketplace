'use client';

import { ChatPageClient } from '@/components/chat/chat-page-client';

export default function SellerChatPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Messages</h1>
      <ChatPageClient currentUserId="seller-demo" role="SELLER" />
    </div>
  );
}
