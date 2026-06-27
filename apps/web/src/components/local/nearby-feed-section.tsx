'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { ListingSummary, NearbyArea } from '@community-marketplace/types';
import { Button } from '@community-marketplace/ui';
import {
  DEFAULT_NEARBY_RADIUS_KM,
  EXPANDED_NEARBY_RADIUS_KM,
} from '@community-marketplace/utils';

import { ListingCard } from '@/components/listings/listing-card';
import { LocalAreaButtons } from '@/components/local/local-area-buttons';
import { LocationPickerModal } from '@/components/local/location-picker-modal';
import {
  buildLocalBrowseParams,
  useUserLocation,
  type LocalFilterMode,
} from '@/hooks/use-user-location';
import { ApiClientError } from '@/lib/api-client';
import { listingsService } from '@/services/listings.service';
import { locationService } from '@/services/location.service';

interface NearbyFeedSectionProps {
  initialListings?: ListingSummary[];
}

export function NearbyFeedSection({ initialListings = [] }: NearbyFeedSectionProps) {
  const {
    location,
    loading: locationLoading,
    needsManualSelection,
    setManualLocation,
    requestLocation,
  } = useUserLocation();

  const [listings, setListings] = useState(initialListings);
  const [areas, setAreas] = useState<NearbyArea[]>([]);
  const [activeFilter, setActiveFilter] = useState<LocalFilterMode>('all');
  const [radiusKm, setRadiusKm] = useState(DEFAULT_NEARBY_RADIUS_KM);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [areasLoading, setAreasLoading] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string>();
  const [showPicker, setShowPicker] = useState(false);

  const loadAreas = useCallback(async (lat: number, lng: number, radius: number) => {
    setAreasLoading(true);
    try {
      const nextAreas = await locationService.getNearbyAreas({
        latitude: lat,
        longitude: lng,
        radiusKm: Math.max(radius, EXPANDED_NEARBY_RADIUS_KM),
        limit: 5,
      });
      setAreas(nextAreas);
    } catch {
      setAreas([]);
    } finally {
      setAreasLoading(false);
    }
  }, []);

  const loadFeed = useCallback(
    async (lat: number, lng: number, radius: number, filter: LocalFilterMode) => {
      setFeedLoading(true);
      setFeedError(null);
      try {
        const feedType = filter === 'free' ? 'free_near_you' : 'new_near_you';
        const area = filter !== 'all' && filter !== 'free' ? filter.area : undefined;

        let result = await listingsService.getFeed({
          feed: feedType,
          latitude: lat,
          longitude: lng,
          radiusKm: radius,
          area,
          limit: 8,
        });

        if (result.data.length === 0 && radius < EXPANDED_NEARBY_RADIUS_KM) {
          const expanded = await listingsService.getFeed({
            feed: feedType,
            latitude: lat,
            longitude: lng,
            radiusKm: EXPANDED_NEARBY_RADIUS_KM,
            area,
            limit: 8,
          });
          if (expanded.data.length > 0) {
            setRadiusKm(EXPANDED_NEARBY_RADIUS_KM);
            result = expanded;
          }
        }

        setListings(result.data);
      } catch (err) {
        setListings([]);
        setFeedError(
          err instanceof ApiClientError && err.code === 'NETWORK_ERROR'
            ? 'Unable to reach the server. Make sure the API is running, then try again.'
            : 'Could not load nearby listings.',
        );
      } finally {
        setFeedLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (!location) return;

    void (async () => {
      if (!location.label) {
        const geocoded = await locationService.reverseGeocode({
          latitude: location.latitude,
          longitude: location.longitude,
        });
        setLocationLabel(geocoded?.areas[0] ?? geocoded?.displayName);
      } else {
        setLocationLabel(location.label);
      }

      await Promise.all([
        loadAreas(location.latitude, location.longitude, radiusKm),
        loadFeed(location.latitude, location.longitude, radiusKm, activeFilter),
      ]);
    })();
  }, [location, loadAreas, loadFeed, radiusKm, activeFilter]);

  const handleFilterChange = useCallback(
    (filter: LocalFilterMode) => {
      setActiveFilter(filter);
      if (!location) return;
      void loadFeed(location.latitude, location.longitude, radiusKm, filter);
    },
    [location, loadFeed, radiusKm],
  );

  const browseHref = useMemo(() => {
    if (!location) return '/listings';
    const params = buildLocalBrowseParams(location, activeFilter, radiusKm);
    return `/listings?${params.toString()}`;
  }, [location, activeFilter, radiusKm]);

  if (locationLoading && !location) {
    return (
      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-sm text-gray-500">Finding listings near you…</p>
        </div>
      </section>
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

      <section className="py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Near you</h2>
                <p className="mt-1 text-sm text-gray-600">
                  {locationLabel
                    ? `Newest listings near ${locationLabel}`
                    : `Newest listings within ${radiusKm} km of your area`}
                </p>
              </div>
              {location && (
                <button
                  type="button"
                  onClick={() => setShowPicker(true)}
                  className="self-start text-xs font-medium text-primary hover:underline sm:self-auto"
                >
                  Change area
                </button>
              )}
            </div>

            {location && (
              <LocalAreaButtons
                areas={areas}
                activeFilter={activeFilter}
                radiusKm={radiusKm}
                loading={feedLoading || areasLoading}
                onFilterChange={handleFilterChange}
              />
            )}
          </div>

          {feedLoading ? (
            <p className="mt-8 text-sm text-gray-500">Loading local listings…</p>
          ) : feedError ? (
            <div className="mt-8 rounded-xl border border-dashed border-amber-200 bg-amber-50 px-6 py-10 text-center">
              <p className="text-sm font-medium text-gray-900">{feedError}</p>
              {location && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() =>
                    void loadFeed(location.latitude, location.longitude, radiusKm, activeFilter)
                  }
                >
                  Try again
                </Button>
              )}
            </div>
          ) : listings.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
              <p className="text-sm font-medium text-gray-900">No listings nearby</p>
              <p className="mt-1 text-sm text-gray-600">
                We expanded the search to {EXPANDED_NEARBY_RADIUS_KM} km but found nothing in your area yet.
              </p>
              <Link href="/listings" className="mt-4 inline-block">
                <Button variant="outline">Browse all listings</Button>
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} showTrust={false} />
              ))}
            </div>
          )}

          {listings.length > 0 && (
            <div className="mt-6 text-center">
              <Link href={browseHref}>
                <Button variant="outline">Browse all local listings</Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
