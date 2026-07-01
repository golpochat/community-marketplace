'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import type { NearbyArea } from '@community-marketplace/types';
import { DEFAULT_NEARBY_RADIUS_KM } from '@community-marketplace/utils';

import {
  LocalAreaButtons,
  parseLocalFilterFromParams,
  serializeLocalFilterToParams,
} from '@/components/local/local-area-buttons';
import { LocationPickerModal } from '@/components/local/location-picker-modal';
import { useUserLocation, type LocalFilterMode } from '@/hooks/use-user-location';
import type { ListingSearchFilters } from '@community-marketplace/types';
import { locationService } from '@/services/location.service';

interface LocalBrowseBarProps {
  filters: ListingSearchFilters;
  onFiltersChange: (filters: ListingSearchFilters) => void;
}

function readRadius(params: URLSearchParams): number {
  const raw = params.get('radiusKm');
  const value = raw ? Number(raw) : DEFAULT_NEARBY_RADIUS_KM;
  return Number.isFinite(value) ? value : DEFAULT_NEARBY_RADIUS_KM;
}

export function LocalBrowseBar({ filters, onFiltersChange }: LocalBrowseBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    location,
    loading: locationLoading,
    needsManualSelection,
    setManualLocation,
    requestLocation,
  } = useUserLocation();

  const [areas, setAreas] = useState<NearbyArea[]>([]);
  const [areasLoading, setAreasLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const radiusKm = filters.radiusKm ?? readRadius(searchParams);
  const activeFilter = parseLocalFilterFromParams(searchParams);
  const isLocalMode =
    searchParams.get('local') === 'true' ||
    (filters.latitude != null && filters.longitude != null);

  useEffect(() => {
    if (!location || !isLocalMode) return;
    setAreasLoading(true);
    void locationService
      .getNearbyAreas({
        latitude: location.latitude,
        longitude: location.longitude,
        radiusKm: Math.max(radiusKm, 20),
        limit: 5,
      })
      .then(setAreas)
      .finally(() => setAreasLoading(false));
  }, [location, isLocalMode, radiusKm]);

  const applyLocalFilter = useCallback(
    (filter: LocalFilterMode) => {
      if (!location) return;

      const params = new URLSearchParams(searchParams.toString());
      params.set('local', 'true');
      params.set('lat', String(location.latitude));
      params.set('lng', String(location.longitude));
      params.set('radiusKm', String(radiusKm));
      serializeLocalFilterToParams(params, filter);
      params.delete('page');
      router.push(`/listings?${params.toString()}`);
    },
    [location, radiusKm, router, searchParams],
  );

  if (!isLocalMode && !locationLoading && !location) {
    return null;
  }

  if (!isLocalMode && location && !locationLoading) {
    return (
      <div className="surface-section p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Browse near you</h2>
            <p className="text-xs text-muted-foreground">
              {location.label ?? 'Show listings in your local area'}
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white"
            onClick={() => {
              onFiltersChange({
                ...filters,
                latitude: location.latitude,
                longitude: location.longitude,
                radiusKm: DEFAULT_NEARBY_RADIUS_KM,
                area: undefined,
                freeOnly: undefined,
                page: 1,
              });
            }}
          >
            Show local listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <LocationPickerModal
        open={(needsManualSelection && !location) || showPicker}
        onSelect={(place) => {
          setManualLocation(place.latitude, place.longitude, `${place.name}, ${place.county}`);
          setShowPicker(false);
        }}
        onRetryGps={() => {
          setShowPicker(false);
          requestLocation();
        }}
      />

      <div className="surface-section p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Local listings</h2>
            <p className="text-xs text-muted-foreground">
              {location?.label ?? `Within ${radiusKm} km of your area`}
            </p>
          </div>
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline"
            onClick={() => setShowPicker(true)}
          >
            Change area
          </button>
        </div>

        {location && (
          <LocalAreaButtons
            areas={areas}
            activeFilter={activeFilter}
            radiusKm={radiusKm}
            loading={areasLoading || locationLoading}
            onFilterChange={applyLocalFilter}
          />
        )}
      </div>
    </>
  );
}
