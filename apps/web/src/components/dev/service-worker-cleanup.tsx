'use client';

import { useEffect } from 'react';

/**
 * Unregister stale PWA service workers in development.
 * Old SW caches can serve outdated JS after code fixes (e.g. notification-list).
 */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    void navigator.serviceWorker?.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        void registration.unregister();
      });
    });

    if ('caches' in window) {
      void caches.keys().then((keys) => {
        keys.forEach((key) => {
          void caches.delete(key);
        });
      });
    }
  }, []);

  return null;
}
