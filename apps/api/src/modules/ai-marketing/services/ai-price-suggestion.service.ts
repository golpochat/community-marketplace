import { Injectable, NotFoundException } from '@nestjs/common';

import type {
  AiPriceSuggestionConfidence,
  AiPriceSuggestionResult,
} from '@community-marketplace/types';
import { extractPrimaryAreaName } from '@community-marketplace/utils';
import type { AiMarketingPriceSuggestInput } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { ListingVisibilityService } from '../../listings/services/listing-visibility.service';
import { AiMarketingAccessService } from './ai-marketing-access.service';

const DISCLAIMER =
  'Advisory only — based on similar active SellNearby listings. Not a valuation or guarantee.';

@Injectable()
export class AiPriceSuggestionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly visibility: ListingVisibilityService,
    private readonly access: AiMarketingAccessService,
  ) {}

  async suggest(
    userId: string,
    input: AiMarketingPriceSuggestInput,
  ): Promise<AiPriceSuggestionResult> {
    await this.access.assertEffective();

    const context = await this.resolveContext(userId, input);
    const area = context.location
      ? extractPrimaryAreaName(context.location)
      : null;

    let rows = await this.fetchComps({
      categoryId: context.categoryId,
      excludeListingId: context.listingId,
      condition: context.condition,
      area,
      limit: 120,
    });

    // Relax condition if too few comps
    if (rows.length < 5 && context.condition) {
      rows = await this.fetchComps({
        categoryId: context.categoryId,
        excludeListingId: context.listingId,
        area,
        limit: 120,
      });
    }

    // Relax area if still thin
    if (rows.length < 5 && area) {
      rows = await this.fetchComps({
        categoryId: context.categoryId,
        excludeListingId: context.listingId,
        limit: 120,
      });
    }

    const prices = this.extractPrices(rows, context);
    const stats = this.computeStats(prices);
    const confidence = this.confidence(stats.compCount);
    const explanation = this.buildExplanation({
      stats,
      confidence,
      areaMatched: rows.length > 0 && area ? area : null,
      condition: context.condition,
      vehicleTightened: Boolean(context.make || context.model),
    });

    return {
      suggestedPrice: stats.median,
      suggestedMin: stats.p25,
      suggestedMax: stats.p75,
      median: stats.median,
      compCount: stats.compCount,
      confidence,
      explanation,
      samplePrices: prices.slice(0, 8),
      areaMatched: rows.length > 0 && area ? area : null,
      categoryId: context.categoryId,
      disclaimer: DISCLAIMER,
    };
  }

  private async resolveContext(
    userId: string,
    input: AiMarketingPriceSuggestInput,
  ): Promise<{
    listingId?: string;
    categoryId: string;
    condition?: string;
    location?: string;
    make?: string;
    model?: string;
    year?: number;
  }> {
    if (input.listingId) {
      const listing = await this.prisma.listing.findFirst({
        where: { id: input.listingId, sellerId: userId },
        select: {
          id: true,
          categoryId: true,
          condition: true,
          locationLabel: true,
          attributes: true,
        },
      });
      if (!listing) throw new NotFoundException('Listing not found');

      const attrs =
        listing.attributes && typeof listing.attributes === 'object'
          ? (listing.attributes as Record<string, unknown>)
          : {};

      return {
        listingId: listing.id,
        categoryId: listing.categoryId,
        condition: input.condition || listing.condition,
        location: input.location || listing.locationLabel,
        make: input.make || (typeof attrs.make === 'string' ? attrs.make : undefined),
        model:
          input.model || (typeof attrs.model === 'string' ? attrs.model : undefined),
        year: this.parseYear(input.year ?? attrs.year),
      };
    }

    if (!input.categoryId) {
      throw new NotFoundException('Category required');
    }

    return {
      categoryId: input.categoryId,
      condition: input.condition,
      location: input.location,
      make: input.make,
      model: input.model,
      year: this.parseYear(input.year),
    };
  }

  private async fetchComps(input: {
    categoryId: string;
    excludeListingId?: string;
    condition?: string;
    area?: string | null;
    limit: number;
  }) {
    return this.prisma.listing.findMany({
      where: this.visibility.visibleListingWhere({
        categoryId: input.categoryId,
        ...(input.excludeListingId
          ? { id: { not: input.excludeListingId } }
          : {}),
        ...(input.condition ? { condition: input.condition } : {}),
        ...(input.area
          ? {
              locationLabel: {
                contains: input.area,
                mode: 'insensitive' as const,
              },
            }
          : {}),
      }),
      select: {
        id: true,
        price: true,
        salePrice: true,
        condition: true,
        locationLabel: true,
        attributes: true,
        activatedAt: true,
      },
      orderBy: { activatedAt: 'desc' },
      take: input.limit,
    });
  }

  private extractPrices(
    rows: Array<{
      price: { toString(): string } | number;
      salePrice: { toString(): string } | number | null;
      attributes: unknown;
    }>,
    context: { make?: string; model?: string; year?: number },
  ): number[] {
    let filtered = rows;

    if (context.make) {
      const make = context.make.toLowerCase();
      filtered = filtered.filter((row) => {
        const attrs = this.asAttrs(row.attributes);
        return typeof attrs.make === 'string' && attrs.make.toLowerCase() === make;
      });
    }

    if (context.model) {
      const model = context.model.toLowerCase();
      filtered = filtered.filter((row) => {
        const attrs = this.asAttrs(row.attributes);
        return (
          typeof attrs.model === 'string' &&
          attrs.model.toLowerCase().includes(model)
        );
      });
    }

    if (context.year) {
      filtered = filtered.filter((row) => {
        const attrs = this.asAttrs(row.attributes);
        const year = this.parseYear(attrs.year);
        return year != null && Math.abs(year - context.year!) <= 2;
      });
    }

    // If vehicle filters wiped comps, fall back to unfiltered category set
    const source = filtered.length >= 3 ? filtered : rows;

    return source
      .map((row) => Number(row.salePrice ?? row.price))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);
  }

  private computeStats(prices: number[]) {
    const compCount = prices.length;
    if (compCount === 0) {
      return {
        compCount: 0,
        median: null as number | null,
        p25: null as number | null,
        p75: null as number | null,
      };
    }

    return {
      compCount,
      median: this.roundMoney(this.percentile(prices, 0.5)),
      p25: this.roundMoney(this.percentile(prices, 0.25)),
      p75: this.roundMoney(this.percentile(prices, 0.75)),
    };
  }

  private confidence(compCount: number): AiPriceSuggestionConfidence {
    if (compCount >= 10) return 'high';
    if (compCount >= 5) return 'medium';
    if (compCount >= 2) return 'low';
    return 'insufficient';
  }

  private buildExplanation(input: {
    stats: {
      compCount: number;
      median: number | null;
      p25: number | null;
      p75: number | null;
    };
    confidence: AiPriceSuggestionConfidence;
    areaMatched: string | null;
    condition?: string;
    vehicleTightened: boolean;
  }): string {
    if (input.stats.compCount === 0 || input.stats.median == null) {
      return 'Not enough similar active listings yet to suggest a price. Check back as more items appear in this category.';
    }

    const parts = [
      `Based on ${input.stats.compCount} similar active listing${input.stats.compCount === 1 ? '' : 's'}`,
    ];
    if (input.areaMatched) parts.push(`near ${input.areaMatched}`);
    if (input.condition) parts.push(`(${input.condition.replace('_', ' ')} condition)`);
    if (input.vehicleTightened) parts.push('matched on vehicle details where possible');

    const range =
      input.stats.p25 != null && input.stats.p75 != null
        ? ` Typical range €${input.stats.p25}–€${input.stats.p75}.`
        : '';

    return `${parts.join(' ')}. Suggested around €${input.stats.median}.${range} Confidence: ${input.confidence}.`;
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 1) return sorted[0]!;
    const idx = (sorted.length - 1) * p;
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo]!;
    const w = idx - lo;
    return sorted[lo]! * (1 - w) + sorted[hi]! * w;
  }

  private roundMoney(value: number): number {
    if (value >= 100) return Math.round(value);
    return Math.round(value * 100) / 100;
  }

  private asAttrs(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object'
      ? (value as Record<string, unknown>)
      : {};
  }

  private parseYear(value: unknown): number | undefined {
    if (value == null || value === '') return undefined;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) && n > 1950 && n < 2100 ? n : undefined;
  }
}
