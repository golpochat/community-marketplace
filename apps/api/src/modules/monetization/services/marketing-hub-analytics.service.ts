import { Injectable } from '@nestjs/common';

import type {
  MarketingHubAnalyticsResponse,
  MarketingHubBoostSourceBucket,
  MarketingHubBoostSourceStats,
} from '@community-marketplace/types';
import type { MarketingHubAnalyticsQueryInput } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { roundMoney } from '../lib/boost.lib';

const SOURCE_ORDER: MarketingHubBoostSourceBucket[] = [
  'marketing_hub',
  'listings_table',
  'listing_edit',
  'unknown',
];

function parseDateRangeBounds(dateFrom: string, dateTo: string): {
  start: Date;
  end: Date;
} {
  return {
    start: new Date(`${dateFrom}T00:00:00.000Z`),
    end: new Date(`${dateTo}T23:59:59.999Z`),
  };
}

function readBoostSource(
  metadata: Record<string, unknown> | null,
): MarketingHubBoostSourceBucket {
  const source = metadata?.source;
  if (
    source === 'marketing_hub' ||
    source === 'listings_table' ||
    source === 'listing_edit'
  ) {
    return source;
  }
  return 'unknown';
}

function asMetadata(
  value: unknown,
): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

@Injectable()
export class MarketingHubAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAnalytics(
    query: MarketingHubAnalyticsQueryInput,
  ): Promise<MarketingHubAnalyticsResponse> {
    const { start, end } = parseDateRangeBounds(query.dateFrom, query.dateTo);
    const createdAt = { gte: start, lte: end };

    const [boostRows, growthPackRows, generationRows] = await Promise.all([
      this.prisma.platformPurchase.findMany({
        where: {
          type: 'listing_boost',
          status: 'succeeded',
          createdAt,
        },
        select: { amount: true, metadata: true },
      }),
      this.prisma.platformPurchase.findMany({
        where: {
          type: 'seller_growth_pack',
          status: 'succeeded',
          createdAt,
        },
        select: { amount: true, metadata: true },
      }),
      this.prisma.aiGenerationLog.findMany({
        where: { createdAt },
        select: {
          userId: true,
          listingId: true,
          creditUnits: true,
          amountEur: true,
        },
      }),
    ]);

    const bySource = new Map<
      MarketingHubBoostSourceBucket,
      MarketingHubBoostSourceStats
    >();
    for (const source of SOURCE_ORDER) {
      bySource.set(source, {
        source,
        count: 0,
        revenueEur: 0,
        withGrowthPackDiscount: 0,
      });
    }

    let boostsRevenue = 0;
    for (const row of boostRows) {
      const metadata = asMetadata(row.metadata);
      const source = readBoostSource(metadata);
      const bucket = bySource.get(source)!;
      const amount = Number(row.amount);
      bucket.count += 1;
      bucket.revenueEur = roundMoney(bucket.revenueEur + amount);
      boostsRevenue = roundMoney(boostsRevenue + amount);
      if (
        metadata?.discountKind === 'growth_pack' ||
        typeof metadata?.growthPackPurchaseId === 'string'
      ) {
        bucket.withGrowthPackDiscount += 1;
      }
    }

    let growthRevenue = 0;
    let discountConsumed = 0;
    let discountUnused = 0;
    for (const row of growthPackRows) {
      growthRevenue = roundMoney(growthRevenue + Number(row.amount));
      const metadata = asMetadata(row.metadata);
      if (metadata?.boostDiscountConsumed === true) {
        discountConsumed += 1;
      } else {
        discountUnused += 1;
      }
    }

    const sellerIds = new Set<string>();
    const listingIds = new Set<string>();
    let creditUnits = 0;
    let generationAmountEur = 0;
    for (const row of generationRows) {
      sellerIds.add(row.userId);
      if (row.listingId) listingIds.add(row.listingId);
      creditUnits += row.creditUnits;
      generationAmountEur = roundMoney(
        generationAmountEur + Number(row.amountEur),
      );
    }

    const hubBoosts = bySource.get('marketing_hub')!.count;
    const generationCount = generationRows.length;

    return {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      currency: 'EUR',
      generations: {
        count: generationCount,
        uniqueSellers: sellerIds.size,
        uniqueListings: listingIds.size,
        creditUnits,
        amountEur: generationAmountEur,
      },
      boostsBySource: SOURCE_ORDER.map((source) => bySource.get(source)!),
      boostsTotal: {
        count: boostRows.length,
        revenueEur: boostsRevenue,
      },
      growthPacks: {
        count: growthPackRows.length,
        revenueEur: growthRevenue,
        discountConsumed,
        discountUnused,
      },
      hubBoostsPerGeneration:
        generationCount > 0
          ? roundMoney(hubBoosts / generationCount)
          : null,
    };
  }
}
