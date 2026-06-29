'use client';

import { useEffect, useState } from 'react';

import type { UserProfile } from '@community-marketplace/types';

import { UserProfilePage } from '@/components/profile/user-profile-page';
import { buyerService } from '@/services/marketplace.service';

export function BuyerProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setProfile(await buyerService.getProfile());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <UserProfilePage
      profile={profile}
      loading={loading}
      error={error}
      onReload={() => void load()}
      onSaveProfile={(body) => buyerService.updateProfile(body)}
      emailVerified={Boolean(profile?.emailVerified)}
      phoneVerified={Boolean(profile?.phoneVerified)}
      editProfileDescription="Update how your name and bio appear to sellers."
    />
  );
}
