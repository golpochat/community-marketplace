'use client';

import { useCallback, useEffect, useState } from 'react';

export type BrowseViewMode = 'grid' | 'list';

const STORAGE_KEY = 'cm-browse-view';

export function getStoredBrowseViewMode(): BrowseViewMode {
  if (typeof window === 'undefined') return 'grid';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'list' ? 'list' : 'grid';
  } catch {
    return 'grid';
  }
}

export function setStoredBrowseViewMode(mode: BrowseViewMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore storage errors
  }
}

export function useBrowseViewMode(): [BrowseViewMode, (mode: BrowseViewMode) => void] {
  const [mode, setModeState] = useState<BrowseViewMode>('grid');

  useEffect(() => {
    setModeState(getStoredBrowseViewMode());
  }, []);

  const setMode = useCallback((next: BrowseViewMode) => {
    setModeState(next);
    setStoredBrowseViewMode(next);
  }, []);

  return [mode, setMode];
}
