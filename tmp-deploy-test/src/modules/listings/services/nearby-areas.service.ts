import { Injectable } from '@nestjs/common';

import type { NearbyArea } from '@community-marketplace/types';
import {
  extractPrimaryAreaName,
  normalizeAreaSlug,
} from '@community-marketplace/utils';
import { nearbyAreasQuerySchema } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { RedisCacheService } from '../../../libs/redis-cache.service';
import { haversineKm } from '../mappers/listing.mapper';
import { ListingVisibilityService } from './listing-visibility.service';
import { GeocodingService } from './geocoding.service';

function mergeAreaCounts(
  geocodedNames: string[],
  listingCounts: Map<string, { name: string; listingCount: number }>,
  limit: number,
): NearbyArea[] {
  const merged = new Map<string, NearbyArea>();

  for (const name of geocodedNames) {
    const key = name.toLowerCase();
    const fromListings = listingCounts.get(key);
    merged.set(key, {
      name,
      slug: normalizeAreaSlug(name),
      listingCount: fromListings?.listingCount ?? 0,
    });
  }

  for (const [key, value] of listingCounts) {
    if (merged.has(key)) continue;
    merged.set(key, {
      name: value.name,
      slug: normalizeAreaSlug(value.name),
      listingCount: value.listingCount,
    });
  }

  return Array.from(merged.values())
    .sort((a, b) => b.listingCount - a.listingCount || a.name.localeCompare(b.name))
    .slice(0, limit);
}

@Injectable()
export class NearbyAreasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
    private readonly visibility: ListingVisibilityService,
    private readonly geocoding: GeocodingService,
  ) {}

  async getNearbyAreas(input: unknown): Promise<NearbyArea[]> {
    const query = nearbyAreasQuerySchema.parse(input);
    const cacheKey = `nearby-areas:${query.latitude.toFixed(3)}:${query.longitude.toFixed(3)}:${query.radiusKm}:${query.limit}`;
    const cached = await this.cache.get<NearbyArea[]>(cacheKey);
    if (cached) return cached;

    const [geocoded, listingCounts] = await Promise.all([
      this.geocoding.reverseGeocode({
        latitude: query.latitude,
        longitude: query.longitude,
      }),
      this.aggregateListingAreas(query.latitude, query.longitude, query.radiusKm),
    ]);

    const areas = mergeAreaCounts(geocoded.areas, listingCounts, query.limit);
    await this.cache.set(cacheKey, areas, 300);
    return areas;
  }

  private async aggregateListingAreas(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<Map<string, { name: string; listingCount: number }>> {
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos((latitude * Math.PI) / 180));

    const rows = await this.prisma.listing.findMany({
      where: {
        ...this.visibility.visibleListingWhere(),
        latitude: { gte: latitude - latDelta, lte: latitude + latDelta },
        longitude: { gte: longitude - lngDelta, lte: longitude + lngDelta },
      },
      select: {
        locationLabel: true,
        latitude: true,
        longitude: true,
      },
    });

    const counts = new Map<string, { name: string; listingCount: number }>();

    for (const row of rows) {
      const distance = haversineKm(
        latitude,
        longitude,
        Number(row.latitude),
        Number(row.longitude),
      );
      if (distance > radiusKm) continue;

      const areaName = extractPrimaryAreaName(row.locationLabel);
      if (!areaName) continue;

      const key = areaName.toLowerCase();
      const existing = counts.get(key);
      if (existing) {
        existing.listingCount += 1;
      } else {
        counts.set(key, { name: areaName, listingCount: 1 });
      }
    }

    return counts;
  }
}
