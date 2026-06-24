'use client';

import { PageHeader } from '@community-marketplace/ui-dashboard';

import { SellerChatLayout } from '@/components/seller/seller-chat-layout';

export default function SellerChatPage() {
  return (
    <>
      <PageHeader title="Chat" description="Message buyers about your listings." />
      <SellerChatLayout />
    </>
  );
}
