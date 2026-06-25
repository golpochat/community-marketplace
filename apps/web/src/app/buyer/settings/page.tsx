'use client';

import { ProfileSettingsForm } from '@/components/dashboard/profile-settings-form';
import { buyerService } from '@/services/marketplace.service';

export default function Page() {
  return (
    <ProfileSettingsForm
      title="Settings"
      description="Manage your profile and preferences."
      loadProfile={() => buyerService.getProfile()}
      saveProfile={(body) => buyerService.updateProfile(body)}
    />
  );
}
