'use client';

import { UserProfilePage } from '@/components/profile/user-profile-page';
import { useSellerProfileData } from '@/hooks/use-seller-profile-data';
import { SELLER_ROUTES } from '@/lib/seller-routes';
import { sellerService } from '@/services/marketplace.service';

export function SellerProfilePage() {
  const { profile, verification, loading, error, reload } = useSellerProfileData();

  const emailReadOnly = verification?.sellerStatus === 'verified';

  return (
    <UserProfilePage
      profile={profile}
      loading={loading}
      error={error}
      onReload={() => void reload()}
      onSaveProfile={(body) => sellerService.updateProfile(body)}
      emailVerified={Boolean(verification?.emailVerified)}
      phoneVerified={Boolean(verification?.phoneVerified)}
      emailNote={
        emailReadOnly ? 'Email cannot be changed after seller verification.' : null
      }
      onOpenVerification={() => {
        window.location.href = SELLER_ROUTES.verification;
      }}
      editProfileDescription="Update your personal display name and bio. Your shop brand is managed in Storefront."
      storefrontHint="Store logo, banner, and shop name are edited in Storefront — not here."
    />
  );
}
