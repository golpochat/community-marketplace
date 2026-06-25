'use client';

import { ProfileSettingsForm } from '@/components/dashboard/profile-settings-form';
import { sellerService } from '@/services/marketplace.service';

export default function Page() {
  return (
    <ProfileSettingsForm
      title="Settings"
      description="Manage your store profile and preferences."
      loadProfile={() => sellerService.getProfile()}
      saveProfile={(body) => sellerService.updateProfile(body)}
    />
  );
}
