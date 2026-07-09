'use client';

import { useEffect } from 'react';

import { useAuthStore } from '@/store/auth.store';

/** Keep client auth state aligned when another tab logs in or out. */
export function AuthSessionSync() {
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== 'cm-auth') return;
      void useAuthStore.persist.rehydrate();
    }

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return null;
}
