import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { listingSearchQuerySchema } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { MeilisearchService } from '../../search/services/meilisearch.service';
import { SearchSemanticService } from '../../search/services/search-semantic.service';
import {
  haversineKm,
  listingInclude,
  mapListingSummaryWithTrust,
  type ListingWithRelations,
} from '../mappers/listing.mapper';
import {
  applyExtendedListingFilters,
  applyExtendedListingSort,
  hasExtendedSearchFilters,
  paginateItems,
} from './listing-search-filters.util';
import { ListingVisibilityService } from './listing-visibility.service';
import { SellerTrustService } from './seller-trust.service';

function listingHasDeliveryAvailable(summary?: string): boolean {
  if (!summary) return false;
  return summary !== 'Collection only';
}

function applyDeliveryFilter<T extends { deliverySummary?: string }>(
  items: T[],
  deliveryAvailable?: boolean,
  deliveryCollection?: boolean,
): T[] {
  if (deliveryAvailable) {
    return items.filter((item) => listingHasDeliveryAvailable(item.deliverySummary));
  }
  if (deliveryCollection) {
    return items.filter((item) => item.deliverySummary === 'Collection only');
  }
  return items;
}

@Injectable()
export class ListingSearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly meilisearch: MeilisearchService,
    private readonly semantic: SearchSemanticService,
    private readonly visibility: ListingVisibilityService,
    private readonly sellerTrust: SellerTrustService,
  ) {}

  async search(input: unknown) {
    const filters = listingSearchQuerySchema.parse(input);
    const needsExtendedProcessing =
      hasExtendedSearchFilters(filters) ||
      Boolean(filters.area?.trim()) ||
      filters.freeOnly === true ||
      filters.sort === 'mileage_low_to_high' ||
      filters.sort === 'mileage_high_to_low' ||
      filters.sort === 'year_newest' ||
      filters.sort === 'year_oldest' ||
      filters.sort === 'highest_rating';

    if (needsExtendedProcessing) {
      return this.searchDatabase(filters);
    }

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
      const orderedRows = ids
        .map((id) => rowMap.get(id))
        .filter((r): r is ListingWithRelations => Boolean(r));
      const data = applyDeliveryFilter(
        await this.summariesFromRows(orderedRows, (row) =>
          filters.latitude !== undefined && filters.longitude !== undefined
            ? haversineKm(
                filters.latitude,
                filters.longitude,
                Number(row.latitude),
                Number(row.longitude),
              )
            : undefined,
        ),
        filters.deliveryAvailable,
        filters.deliveryCollection,
      );

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
      ...(filters.deliveryAvailable
        ? {
            deliveryOptions: {
              some: {
                deliveryOption: {
                  zone: { in: ['LOCAL', 'NATIONAL', 'CUSTOM'] },
                },
              },
            },
          }
        : {}),
      ...(filters.deliveryCollection
        ? {
            AND: [
              {
                deliveryOptions: {
                  some: { deliveryOption: { zone: 'COLLECTION' } },
                },
              },
              {
                deliveryOptions: {
                  none: {
                    deliveryOption: {
                      zone: { in: ['LOCAL', 'NATIONAL', 'CUSTOM'] },
                    },
                  },
                },
              },
            ],
          }
        : {}),
      ...(filters.sellerVerified
        ? {
            seller: {
              verifications: {
                some: { badgeGranted: true, status: 'approved' },
              },
            },
          }
        : {}),
      ...(filters.sellerBusiness === true
        ? { seller: { profile: { isBusinessAccount: true } } }
        : filters.sellerBusiness === false
          ? { seller: { profile: { isBusinessAccount: false } } }
          : {}),
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: 'insensitive' } },
              { description: { contains: filters.q, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(filters.area?.trim()
        ? {
            locationLabel: { contains: filters.area.trim(), mode: 'insensitive' },
          }
        : {}),
      ...(filters.freeOnly ? { price: 0 } : {}),
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
    const needsExtendedProcessing =
      hasExtendedSearchFilters(filters) ||
      filters.sort === 'mileage_low_to_high' ||
      filters.sort === 'mileage_high_to_low' ||
      filters.sort === 'year_newest' ||
      filters.sort === 'year_oldest' ||
      filters.sort === 'highest_rating';

    if (needsExtendedProcessing) {
      const rows = await this.prisma.listing.findMany({
        where,
        include: listingInclude,
        orderBy: { createdAt: 'desc' },
        take: 500,
      });

      let data = applyDeliveryFilter(
        await this.summariesFromRows(rows, (row) =>
          filters.latitude !== undefined && filters.longitude !== undefined
            ? haversineKm(
                filters.latitude,
                filters.longitude,
                Number(row.latitude),
                Number(row.longitude),
              )
            : undefined,
        ),
        filters.deliveryAvailable,
        filters.deliveryCollection,
      );

      data = applyExtendedListingFilters(data, filters);
      data = applyExtendedListingSort(data, filters.sort);

      const total = data.length;
      const pageData = paginateItems(data, filters.page, filters.limit);

      return {
        data: pageData,
        meta: {
          page: filters.page,
          limit: filters.limit,
          total,
          totalPages: Math.ceil(total / filters.limit),
        },
      };
    }

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

    const data = applyDeliveryFilter(
      await this.summariesFromRows(rows, (row) =>
        filters.latitude !== undefined && filters.longitude !== undefined
          ? haversineKm(
              filters.latitude,
              filters.longitude,
              Number(row.latitude),
              Number(row.longitude),
            )
          : undefined,
      ),
      filters.deliveryAvailable,
      filters.deliveryCollection,
    );

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

  private async summariesFromRows(
    rows: ListingWithRelations[],
    distanceFor: (row: ListingWithRelations) => number | undefined,
  ) {
    const trustMap = await this.sellerTrust.getSummariesForSellers(rows.map((r) => r.sellerId));
    return rows.map((row) => {
      const trust = trustMap.get(row.sellerId);
      return mapListingSummaryWithTrust(
        row,
        distanceFor(row),
        trust
          ? {
              averageRating: trust.averageRating,
              reviewCount: trust.reviewCount,
              soldCount: trust.soldCount,
            }
          : undefined,
      );
    });
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
        return [{ boostedUntil: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }];
    }
  }
}
