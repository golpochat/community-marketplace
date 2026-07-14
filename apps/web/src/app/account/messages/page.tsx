'use client';

import { PageHeader } from '@community-marketplace/ui-dashboard';

import { AccountChatLayout } from '@/components/account/account-chat-layout';

export default function AccountMessagesPage() {
  return (
    <>
      <PageHeader title="Messages" description="Message buyers and sellers about listings." />
      <AccountChatLayout />
    </>
  );
}
