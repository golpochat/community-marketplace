'use client';

import { PageHeader } from '@community-marketplace/ui-dashboard';

import { BuyerChatLayout } from '@/components/buyer/buyer-chat-layout';

export default function BuyerChatPage() {
  return (
    <>
      <PageHeader title="Chat" description="Message sellers about listings." />
      <BuyerChatLayout />
    </>
  );
}
