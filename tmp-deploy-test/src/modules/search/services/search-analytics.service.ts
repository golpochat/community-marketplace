import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { SearchAnalyticsSummary } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { RedisCacheService } from '../../../libs/redis-cache.service';

@Injectable()
export class SearchAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  async trackSearch(input: {
    query: string;
    entity: string;
    resultCount: number;
    userId?: string;
    metadata?: Record<string, unknown>;
  }) {
    await this.prisma.searchAnalyticsEvent.create({
      data: {
        query: input.query.toLowerCase().trim(),
        entity: input.entity,
        resultCount: input.resultCount,
        userId: input.userId,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
    await this.cache.del('search:analytics:summary');
  }

  async trackClick(input: {
    query: string;
    entity: string;
    clickedId: string;
    userId?: string;
  }) {
    await this.prisma.searchAnalyticsEvent.create({
      data: {
        query: input.query.toLowerCase().trim(),
        entity: input.entity,
        resultCount: 1,
        clickedId: input.clickedId,
        userId: input.userId,
      },
    });
    await this.cache.del('search:analytics:summary');
  }

  async getSummary(): Promise<SearchAnalyticsSummary> {
    const cached = await this.cache.get<SearchAnalyticsSummary>('search:analytics:summary');
    if (cached) return cached;

    const since = new Date();
    since.setDate(since.getDate() - 30);

    const events = await this.prisma.searchAnalyticsEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { query: true, resultCount: true, clickedId: true, metadata: true },
    });

    const keywordCounts = new Map<string, number>();
    const zeroResults = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    let clicks = 0;

    for (const event of events) {
      keywordCounts.set(event.query, (keywordCounts.get(event.query) ?? 0) + 1);
      if (event.resultCount === 0) {
        zeroResults.set(event.query, (zeroResults.get(event.query) ?? 0) + 1);
      }
      if (event.clickedId) clicks += 1;
      const categoryId = (event.metadata as { categoryId?: string } | null)?.categoryId;
      if (categoryId) {
        categoryCounts.set(categoryId, (categoryCounts.get(categoryId) ?? 0) + 1);
      }
    }

    const summary: SearchAnalyticsSummary = {
      popularKeywords: [...keywordCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([query, count]) => ({ query, count })),
      zeroResultQueries: [...zeroResults.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([query, count]) => ({ query, count })),
      trendingCategories: [...categoryCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([categoryId, count]) => ({ categoryId, count })),
      totalSearches: events.length,
      clickThroughRate: events.length ? clicks / events.length : 0,
    };

    await this.cache.set('search:analytics:summary', summary, 300);
    return summary;
  }
}
