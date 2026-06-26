'use client';

import { useCallback, useEffect, useState } from 'react';

import type { UserGeoLocation } from '@community-marketplace/types';
import { DEFAULT_NEARBY_RADIUS_KM } from '@community-marketplace/utils';

import { USER_LOCATION_STORAGE_KEY } from '@/lib/ireland-locations';

export type LocalFilterMode = 'all' | 'free' | { area: string };

interface UseUserLocationResult {
  location: UserGeoLocation | null;
  loading: boolean;
  needsManualSelection: boolean;
  radiusKm: number;
  setManualLocation: (latitude: number, longitude: number, label: string) => void;
  requestLocation: () => void;
  clearNeedsManualSelection: () => void;
}

function readStoredLocation(): UserGeoLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_LOCATION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserGeoLocation;
    if (
      typeof parsed.latitude === 'number' &&
      typeof parsed.longitude === 'number'
    ) {
      return { ...parsed, source: 'stored' };
    }
  } catch {
    return null;
  }
  return null;
}

function persistLocation(location: UserGeoLocation) {
  localStorage.setItem(USER_LOCATION_STORAGE_KEY, JSON.stringify(location));
}

export function useUserLocation(radiusKm = DEFAULT_NEARBY_RADIUS_KM): UseUserLocationResult {
  const [location, setLocation] = useState<UserGeoLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsManualSelection, setNeedsManualSelection] = useState(false);

  const applyLocation = useCallback((next: UserGeoLocation) => {
    persistLocation(next);
    setLocation(next);
    setNeedsManualSelection(false);
  }, []);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setNeedsManualSelection(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        applyLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          source: 'gps',
        });
        setLoading(false);
      },
      () => {
        const stored = readStoredLocation();
        if (stored) {
          setLocation(stored);
          setNeedsManualSelection(false);
        } else {
          setNeedsManualSelection(true);
        }
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }, [applyLocation]);

  useEffect(() => {
    const stored = readStoredLocation();
    if (stored) {
      setLocation(stored);
      setLoading(false);
      return;
    }
    requestLocation();
  }, [requestLocation]);

  const setManualLocation = useCallback(
    (latitude: number, longitude: number, label: string) => {
      applyLocation({
        latitude,
        longitude,
        label,
        source: 'manual',
      });
      setLoading(false);
    },
    [applyLocation],
  );

  return {
    location,
    loading,
    needsManualSelection,
    radiusKm,
    setManualLocation,
    requestLocation,
    clearNeedsManualSelection: () => setNeedsManualSelection(false),
  };
}

export function buildLocalBrowseParams(
  location: UserGeoLocation,
  mode: LocalFilterMode,
  radiusKm: number,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set('lat', String(location.latitude));
  params.set('lng', String(location.longitude));
  params.set('radiusKm', String(radiusKm));
  params.set('local', 'true');

  if (mode === 'free') {
    params.set('freeOnly', 'true');
  } else if (mode !== 'all') {
    params.set('area', mode.area);
  }

  return params;
}
