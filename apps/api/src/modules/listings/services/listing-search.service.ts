import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { listingSearchQuerySchema } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { MeilisearchService } from '../../search/services/meilisearch.service';
import { SearchSemanticService } from '../../search/services/search-semantic.service';
import {
  haversineKm,
  listingInclude,
  mapListingSummary,
} from '../mappers/listing.mapper';
import { ListingVisibilityService } from './listing-visibility.service';

@Injectable()
export class ListingSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meilisearch: MeilisearchService,
    private readonly semantic: SearchSemanticService,
    private readonly visibility: ListingVisibilityService,
  ) {}

  async search(input: unknown) {
    const filters = listingSearchQuerySchema.parse(input);
    const offset = filters.cursor
      ? 0
      : (filters.page - 1) * filters.limit;

    const meiliResult = await this.meilisearch.searchListings(filters.q ?? '', {
      limit: filters.limit,
      offset,
      categoryId: filters.categoryId,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      condition: filters.condition,
      latitude: filters.latitude,
      longitude: filters.longitude,
      radiusKm: filters.radiusKm,
      sort: filters.sort,
      cursor: filters.cursor,
    });

    if (this.meilisearch.isAvailable() && meiliResult.hits.length > 0) {
      let hits = meiliResult.hits as Array<Record<string, unknown> & { embedding?: number[] }>;

      if (filters.semantic && filters.q) {
        hits = await this.semantic.hybridRank(
          filters.q,
          hits,
          hits.map((_, i) => hits.length - i),
        );
      }

      const ids = hits.map((h) => String(h.id));
      const rows = await this.prisma.listing.findMany({
        where: { id: { in: ids }, ...this.visibility.visibleListingWhere() },
        include: listingInclude,
      });
      const rowMap = new Map(rows.map((r) => [r.id, r]));
      const data = ids
        .map((id) => rowMap.get(id))
        .filter((r): r is NonNullable<typeof r> => Boolean(r))
        .map((row) => {
          const distanceKm =
            filters.latitude !== undefined && filters.longitude !== undefined
              ? haversineKm(
                  filters.latitude,
                  filters.longitude,
                  Number(row.latitude),
                  Number(row.longitude),
                )
              : undefined;
          return mapListingSummary(row, distanceKm);
        });

      const lastHit = hits[hits.length - 1] as { createdAt?: number } | undefined;
      const nextCursor =
        data.length === filters.limit && lastHit?.createdAt
          ? String(lastHit.createdAt)
          : undefined;

      return {
        data,
        meta: {
          page: filters.page,
          limit: filters.limit,
          total: meiliResult.estimatedTotalHits ?? data.length,
          totalPages: Math.ceil((meiliResult.estimatedTotalHits ?? data.length) / filters.limit),
          nextCursor,
        },
      };
    }

    if (this.meilisearch.isAvailable() && filters.q) {
      return {
        data: [],
        meta: {
          page: filters.page,
          limit: filters.limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    return this.searchDatabase(filters);
  }

  private async searchDatabase(
    filters: ReturnType<typeof listingSearchQuerySchema.parse>,
  ) {
    const where: Prisma.ListingWhereInput = {
      ...this.visibility.visibleListingWhere(),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.condition ? { condition: filters.condition } : {}),
      ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
        ? {
            price: {
              ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
              ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
            },
          }
        : {}),
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: 'insensitive' } },
              { description: { contains: filters.q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    if (filters.latitude !== undefined && filters.longitude !== undefined) {
      const radius = filters.radiusKm ?? 25;
      const latDelta = radius / 111;
      const lngDelta = radius / (111 * Math.cos((filters.latitude * Math.PI) / 180));
      where.latitude = {
        gte: filters.latitude - latDelta,
        lte: filters.latitude + latDelta,
      };
      where.longitude = {
        gte: filters.longitude - lngDelta,
        lte: filters.longitude + lngDelta,
      };
    }

    const orderBy = this.resolveOrderBy(filters.sort);

    const [rows, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: listingInclude,
        orderBy,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.listing.count({ where }),
    ]);

    const data = rows.map((row) => {
      const distanceKm =
        filters.latitude !== undefined && filters.longitude !== undefined
          ? haversineKm(
              filters.latitude,
              filters.longitude,
              Number(row.latitude),
              Number(row.longitude),
            )
          : undefined;
      return mapListingSummary(row, distanceKm);
    });

    if (filters.sort === 'nearest' && filters.latitude !== undefined) {
      data.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    }

    return {
      data,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  private resolveOrderBy(
    sort: string,
  ): Prisma.ListingOrderByWithRelationInput | Prisma.ListingOrderByWithRelationInput[] {
    switch (sort) {
      case 'price_low_to_high':
        return { price: 'asc' };
      case 'price_high_to_low':
        return { price: 'desc' };
      case 'nearest':
        return { createdAt: 'desc' };
      case 'newest':
      default:
        return { createdAt: 'desc' };
    }
  }
}
