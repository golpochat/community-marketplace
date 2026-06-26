'use client';

import { ProfileSettingsForm } from '@/components/dashboard/profile-settings-form';

export default function Page() {
  return (
    <ProfileSettingsForm
      title="Profile"
      description="Manage your account details and preferences."
      defaultTab="profile"
      includeNotificationPreferences={false}
    />
  );
}
