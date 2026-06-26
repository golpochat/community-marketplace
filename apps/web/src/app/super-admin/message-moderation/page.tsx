'use client';

import { AdminMessageModerationPage } from '@/components/admin/message-moderation/admin-message-moderation-page';

export default function Page() {
  return (
    <AdminMessageModerationPage
      role="SUPER_ADMIN"
      canModerate
      canSuspendSeller
    />
  );
}
