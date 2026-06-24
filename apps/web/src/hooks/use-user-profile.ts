'use client';

import { useEffect, useState } from 'react';

import type { UserEffectivePermissions, UserProfile } from '@community-marketplace/types';

import { useAuth } from '@/hooks/use-auth';
import { userService } from '@/services/user.service';

export function useUserProfile() {
  const { isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [permissions, setPermissions] = useState<UserEffectivePermissions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setProfile(null);
      setPermissions(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([userService.getMyProfile(), userService.getMyPermissions()])
      .then(([profileData, permissionsData]) => {
        if (!cancelled) {
          setProfile(profileData);
          setPermissions(permissionsData);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return { profile, permissions, loading, error };
}
