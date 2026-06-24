'use client';

import { RolePageContent } from '@/components/dashboard/role-page-content';

export default function AdminModerationPage() {
  return (
    <RolePageContent
      title="Moderation"
      description="Take action on policy violations and appeals."
      cardTitle="Moderation tools"
    />
  );
}
