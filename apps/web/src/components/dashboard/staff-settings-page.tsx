'use client';

import { UserSettingsForm } from '@/components/dashboard/user-settings-form';

export function StaffSettingsPage() {
  return (
    <UserSettingsForm
      title="Settings"
      description="Notification, privacy, and communication preferences."
    />
  );
}
