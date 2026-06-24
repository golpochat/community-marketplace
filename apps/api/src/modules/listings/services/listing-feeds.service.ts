import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { listingFeedQuerySchema } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { RedisCacheService } from '../../../libs/redis-cache.service';
import {
  haversineKm,
  listingInclude,
  mapListingSummary,
} from '../mappers/listing.mapper';
import { ListingVisibilityService } from './listing-visibility.service';

@Injectable()
export class ListingFeedsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
    private readonly visibility: ListingVisibilityService,
  ) {}

  async getFeed(input: unknown) {
    const query = listingFeedQuerySchema.parse(input);
    const cacheKey = `feed:${query.feed}:${query.latitude}:${query.longitude}:${query.radiusKm}:${query.page}:${query.limit}`;

    const cached = await this.cache.get<{
      data: ReturnType<typeof mapListingSummary>[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>(cacheKey);
    if (cached) return cached;

    const latDelta = query.radiusKm / 111;
    const lngDelta =
      query.radiusKm / (111 * Math.cos((query.latitude * Math.PI) / 180));

    const geoWhere: Prisma.ListingWhereInput = {
      latitude: { gte: query.latitude - latDelta, lte: query.latitude + latDelta },
      longitude: {
        gte: query.longitude - lngDelta,
        lte: query.longitude + lngDelta,
      },
    };

    let where: Prisma.ListingWhereInput = {
      ...this.visibility.visibleListingWhere(),
      ...geoWhere,
    };
    let orderBy: Prisma.ListingOrderByWithRelationInput = { createdAt: 'desc' };

    switch (query.feed) {
      case 'free_near_you':
        where = { ...where, price: 0 };
        break;
      case 'trending':
        orderBy = { favoriteCount: 'desc' };
        break;
      case 'recently_sold_near_you':
        where = {
          ...geoWhere,
          status: 'sold',
          seller: { status: 'active' },
        };
        orderBy = { updatedAt: 'desc' };
        break;
      case 'new_near_you':
      default:
        break;
    }

    const [rows, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: listingInclude,
        orderBy,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    const data = rows.map((row) =>
      mapListingSummary(
        row,
        haversineKm(
          query.latitude,
          query.longitude,
          Number(row.latitude),
          Number(row.longitude),
        ),
      ),
    );

    const result = {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };

    await this.cache.set(cacheKey, result, 60);
    return result;
  }
}
