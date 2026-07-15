'use client';

import { useEffect } from 'react';

/** Silently corrects the address bar when the slug is stale but already identifies the listing. */
export function ListingCanonicalPathSync({ path }: { path: string }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname === path) return;
    window.history.replaceState(window.history.state, '', `${path}${window.location.search}`);
  }, [path]);

  return null;
}
