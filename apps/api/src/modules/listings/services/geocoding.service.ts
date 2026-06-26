import { Injectable } from '@nestjs/common';

import type { ReverseGeocodeResult } from '@community-marketplace/types';
import { reverseGeocodeQuerySchema } from '@community-marketplace/validation';

import { RedisCacheService } from '../../../libs/redis-cache.service';

const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const CACHE_TTL_SECONDS = 86_400;

interface NominatimAddress {
  suburb?: string;
  neighbourhood?: string;
  town?: string;
  village?: string;
  city?: string;
  city_district?: string;
  municipality?: string;
  county?: string;
  state?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
}

function uniqueAreas(values: Array<string | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key) || key === 'ireland') continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

@Injectable()
export class GeocodingService {
  constructor(private readonly cache: RedisCacheService) {}

  async reverseGeocode(input: unknown): Promise<ReverseGeocodeResult> {
    const query = reverseGeocodeQuerySchema.parse(input);
    const cacheKey = `geocode:reverse:${query.latitude.toFixed(4)}:${query.longitude.toFixed(4)}`;
    const cached = await this.cache.get<ReverseGeocodeResult>(cacheKey);
    if (cached) return cached;

    const url = new URL(NOMINATIM_REVERSE_URL);
    url.searchParams.set('lat', String(query.latitude));
    url.searchParams.set('lon', String(query.longitude));
    url.searchParams.set('format', 'json');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('zoom', '14');

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'CommunityMarketplace/1.0 (local listings)',
      },
    });

    if (!response.ok) {
      return {
        latitude: query.latitude,
        longitude: query.longitude,
        areas: [],
      };
    }

    const payload = (await response.json()) as NominatimResponse;
    const address = payload.address;
    const areas = uniqueAreas([
      address?.suburb,
      address?.neighbourhood,
      address?.town,
      address?.village,
      address?.city_district,
      address?.city,
      address?.municipality,
      address?.county?.replace(/\s*County$/i, ''),
    ]);

    const result: ReverseGeocodeResult = {
      latitude: query.latitude,
      longitude: query.longitude,
      areas,
      displayName: payload.display_name,
    };

    await this.cache.set(cacheKey, result, CACHE_TTL_SECONDS);
    return result;
  }
}
