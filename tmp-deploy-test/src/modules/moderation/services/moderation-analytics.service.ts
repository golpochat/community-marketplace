import { Injectable } from '@nestjs/common';

import type { ModerationAnalytics } from '@community-marketplace/types';
import { moderationAnalyticsQuerySchema } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { RedisCacheService } from '../../../libs/redis-cache.service';

@Injectable()
export class ModerationAnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
  ) {}

  async getSummary(query: unknown): Promise<ModerationAnalytics> {
    const parsed = moderationAnalyticsQuerySchema.parse(query ?? {});
    const cacheKey = `moderation:analytics:${parsed.days}`;

    const cached = await this.cache.get<ModerationAnalytics>(cacheKey);
    if (cached) return cached;

    const since = new Date();
    since.setDate(since.getDate() - parsed.days);

    const [
      userReports,
      listingReports,
      reasonGroups,
      actionGroups,
      appealGroups,
    ] = await Promise.all([
      this.prisma.moderationReport.groupBy({
        by: ['targetUserId'],
        where: { targetUserId: { not: null }, createdAt: { gte: since } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.moderationReport.groupBy({
        by: ['listingId'],
        where: { listingId: { not: null }, createdAt: { gte: since } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
      this.prisma.moderationReport.groupBy({
        by: ['reason'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
      }),
      this.prisma.moderationAction.groupBy({
        by: ['actionType'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
      }),
      this.prisma.moderationAppeal.groupBy({
        by: ['status'],
        where: { createdAt: { gte: since } },
        _count: { id: true },
      }),
    ]);

    const userIds = userReports.map((r) => r.targetUserId!).filter(Boolean);
    const listingIds = listingReports.map((r) => r.listingId!).filter(Boolean);

    const [users, listings] = await Promise.all([
      userIds.length
        ? this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, displayName: true },
          })
        : [],
      listingIds.length
        ? this.prisma.listing.findMany({
            where: { id: { in: listingIds } },
            select: { id: true, title: true },
          })
        : [],
    ]);

    const userMap = new Map(users.map((u) => [u.id, u.displayName ?? undefined]));
    const listingMap = new Map(listings.map((l) => [l.id, l.title]));

    const actionStats = {
      warnings: 0,
      suspensions: 0,
      bans: 0,
      deleteListings: 0,
      deleteMessages: 0,
    };

    for (const group of actionGroups) {
      switch (group.actionType) {
        case 'warn':
          actionStats.warnings = group._count.id;
          break;
        case 'suspend':
          actionStats.suspensions = group._count.id;
          break;
        case 'ban':
          actionStats.bans = group._count.id;
          break;
        case 'delete_listing':
          actionStats.deleteListings = group._count.id;
          break;
        case 'delete_message':
          actionStats.deleteMessages = group._count.id;
          break;
      }
    }

    const appealOutcomes = { pending: 0, approved: 0, rejected: 0 };
    for (const group of appealGroups) {
      appealOutcomes[group.status] = group._count.id;
    }

    const summary: ModerationAnalytics = {
      mostReportedUsers: userReports.map((r) => ({
        userId: r.targetUserId!,
        count: r._count.id,
        displayName: userMap.get(r.targetUserId!),
      })),
      mostReportedListings: listingReports.map((r) => ({
        listingId: r.listingId!,
        count: r._count.id,
        title: listingMap.get(r.listingId!),
      })),
      reasonDistribution: reasonGroups.map((r) => ({
        reason: r.reason,
        count: r._count.id,
      })),
      actionStats,
      appealOutcomes,
      generatedAt: new Date().toISOString(),
    };

    await this.cache.set(cacheKey, summary, 300);
    return summary;
  }

  async invalidateCache() {
    await this.cache.del('moderation:analytics:30');
    await this.cache.del('moderation:analytics:7');
    await this.cache.del('moderation:analytics:90');
  }
}
