import { Injectable, NotFoundException } from '@nestjs/common';

import { PLATFORM_TIMEZONE } from '@community-marketplace/config';
import type {
  AiBestPostingTimeConfidence,
  AiBestPostingTimeResult,
  AiBestPostingTimeSlot,
  AiBestPostingTimeSource,
  AiBestPostingTimeWindow,
} from '@community-marketplace/types';
import type { AiMarketingBestPostingTimeInput } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { AiMarketingAccessService } from './ai-marketing-access.service';

const DISCLAIMER =
  'Advisory only — based on Irish marketplace patterns and recent SellNearby buyer activity when available. Not a guarantee of reach or sales.';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
const LOOKBACK_DAYS = 90;
const STATS_MIN_SAMPLE = 25;
const STATS_GOOD_SAMPLE = 80;

type CategoryFamily = 'vehicles' | 'property' | 'services' | 'general';

@Injectable()
export class AiBestPostingTimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AiMarketingAccessService,
  ) {}

  async suggest(
    userId: string,
    input: AiMarketingBestPostingTimeInput,
  ): Promise<AiBestPostingTimeResult> {
    await this.access.assertEffective();

    const context = await this.resolveContext(userId, input);
    const family = this.categoryFamily(context.categorySlug, context.categoryName);
    const heuristic = this.heuristicWindows(family);

    const events = context.categoryId
      ? await this.collectEngagementTimestamps(context.categoryId)
      : [];

    if (events.length < STATS_MIN_SAMPLE) {
      return this.buildResult({
        windows: heuristic.windows,
        topSlots: heuristic.topSlots,
        confidence: 'heuristic',
        sampleSize: events.length,
        source: 'heuristic',
        explanation: this.heuristicExplanation(family, events.length),
        categoryId: context.categoryId,
        categoryName: context.categoryName,
      });
    }

    const scored = this.scoreSlots(events);
    const topSlots = scored.slice(0, 5);
    const windows = this.mergeWindows(heuristic.windows, topSlots);
    const confidence = this.confidence(events.length);
    const source: AiBestPostingTimeSource =
      events.length >= STATS_GOOD_SAMPLE ? 'stats' : 'hybrid';

    return this.buildResult({
      windows,
      topSlots,
      confidence,
      sampleSize: events.length,
      source,
      explanation: this.statsExplanation({
        family,
        sampleSize: events.length,
        topSlots,
        source,
      }),
      categoryId: context.categoryId,
      categoryName: context.categoryName,
    });
  }

  private async resolveContext(
    userId: string,
    input: AiMarketingBestPostingTimeInput,
  ): Promise<{
    categoryId: string | null;
    categoryName: string | null;
    categorySlug: string | null;
  }> {
    if (input.listingId) {
      const listing = await this.prisma.listing.findFirst({
        where: { id: input.listingId, sellerId: userId },
        select: {
          category: { select: { id: true, name: true, slug: true } },
        },
      });
      if (!listing) throw new NotFoundException('Listing not found');
      return {
        categoryId: listing.category.id,
        categoryName: listing.category.name,
        categorySlug: listing.category.slug,
      };
    }

    if (!input.categoryId) {
      return { categoryId: null, categoryName: null, categorySlug: null };
    }

    const category = await this.prisma.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true, name: true, slug: true },
    });
    if (!category) throw new NotFoundException('Category not found');

    return {
      categoryId: category.id,
      categoryName: category.name,
      categorySlug: category.slug,
    };
  }

  private async collectEngagementTimestamps(categoryId: string): Promise<Date[]> {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - LOOKBACK_DAYS);

    const [favorites, threads] = await Promise.all([
      this.prisma.listingFavorite.findMany({
        where: {
          createdAt: { gte: since },
          listing: { categoryId },
        },
        select: { createdAt: true },
        take: 2_000,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.chatThread.findMany({
        where: {
          createdAt: { gte: since },
          listing: { categoryId },
        },
        select: { createdAt: true, lastMessageAt: true },
        take: 2_000,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const stamps: Date[] = favorites.map((row) => row.createdAt);
    for (const thread of threads) {
      stamps.push(thread.createdAt);
      if (thread.lastMessageAt) stamps.push(thread.lastMessageAt);
    }
    return stamps;
  }

  private scoreSlots(events: Date[]): AiBestPostingTimeSlot[] {
    const counts = new Map<string, number>();
    for (const event of events) {
      const parts = this.dublinParts(event);
      const key = `${parts.dayOfWeek}:${parts.hour}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([key, score]) => {
        const [dayRaw, hourRaw] = key.split(':');
        const dayOfWeek = Number(dayRaw);
        const hour = Number(hourRaw);
        return {
          dayOfWeek,
          hour,
          score,
          label: `${DAY_LABELS[dayOfWeek] ?? 'Day'} ${this.formatHour(hour)}`,
        };
      })
      .sort((a, b) => b.score - a.score || a.dayOfWeek - b.dayOfWeek || a.hour - b.hour);
  }

  private dublinParts(date: Date): { dayOfWeek: number; hour: number } {
    const weekday = new Intl.DateTimeFormat('en-IE', {
      timeZone: PLATFORM_TIMEZONE,
      weekday: 'short',
    }).format(date);
    const hourRaw = new Intl.DateTimeFormat('en-IE', {
      timeZone: PLATFORM_TIMEZONE,
      hour: 'numeric',
      hour12: false,
    }).format(date);
    const hour = Number(hourRaw.replace(/\D/g, '')) % 24;
    const dayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };
    return { dayOfWeek: dayMap[weekday] ?? date.getUTCDay(), hour };
  }

  private categoryFamily(
    slug: string | null,
    name: string | null,
  ): CategoryFamily {
    const hay = `${slug ?? ''} ${name ?? ''}`.toLowerCase();
    if (
      /vehicle|car|motor|van|bike|motorbike|auto|boat/.test(hay)
    ) {
      return 'vehicles';
    }
    if (/propert|home|house|apartment|flat|rent/.test(hay)) {
      return 'property';
    }
    if (/service|job|tutor|repair|clean/.test(hay)) {
      return 'services';
    }
    return 'general';
  }

  private heuristicWindows(family: CategoryFamily): {
    windows: AiBestPostingTimeWindow[];
    topSlots: AiBestPostingTimeSlot[];
  } {
    switch (family) {
      case 'vehicles':
        return {
          windows: [
            {
              label: 'Weekend mornings',
              days: ['Sat', 'Sun'],
              startHour: 9,
              endHour: 13,
            },
            {
              label: 'Weekday evenings',
              days: ['Tue', 'Wed', 'Thu'],
              startHour: 18,
              endHour: 21,
            },
          ],
          topSlots: [
            { dayOfWeek: 6, hour: 10, score: 3, label: 'Sat 10:00' },
            { dayOfWeek: 0, hour: 11, score: 3, label: 'Sun 11:00' },
            { dayOfWeek: 3, hour: 19, score: 2, label: 'Wed 19:00' },
          ],
        };
      case 'property':
        return {
          windows: [
            {
              label: 'Weekday lunch',
              days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
              startHour: 12,
              endHour: 14,
            },
            {
              label: 'Sunday afternoon',
              days: ['Sun'],
              startHour: 14,
              endHour: 18,
            },
          ],
          topSlots: [
            { dayOfWeek: 2, hour: 12, score: 3, label: 'Tue 12:00' },
            { dayOfWeek: 0, hour: 15, score: 3, label: 'Sun 15:00' },
            { dayOfWeek: 4, hour: 13, score: 2, label: 'Thu 13:00' },
          ],
        };
      case 'services':
        return {
          windows: [
            {
              label: 'Weekday mornings',
              days: ['Mon', 'Tue', 'Wed', 'Thu'],
              startHour: 8,
              endHour: 11,
            },
            {
              label: 'Sunday evening planning',
              days: ['Sun'],
              startHour: 18,
              endHour: 21,
            },
          ],
          topSlots: [
            { dayOfWeek: 1, hour: 9, score: 3, label: 'Mon 09:00' },
            { dayOfWeek: 2, hour: 10, score: 2, label: 'Tue 10:00' },
            { dayOfWeek: 0, hour: 19, score: 2, label: 'Sun 19:00' },
          ],
        };
      case 'general':
      default:
        return {
          windows: [
            {
              label: 'Weekday evenings',
              days: ['Mon', 'Tue', 'Wed', 'Thu'],
              startHour: 18,
              endHour: 21,
            },
            {
              label: 'Saturday mid-morning',
              days: ['Sat'],
              startHour: 10,
              endHour: 13,
            },
          ],
          topSlots: [
            { dayOfWeek: 2, hour: 19, score: 3, label: 'Tue 19:00' },
            { dayOfWeek: 3, hour: 20, score: 3, label: 'Wed 20:00' },
            { dayOfWeek: 6, hour: 11, score: 2, label: 'Sat 11:00' },
          ],
        };
    }
  }

  private mergeWindows(
    heuristic: AiBestPostingTimeWindow[],
    topSlots: AiBestPostingTimeSlot[],
  ): AiBestPostingTimeWindow[] {
    if (topSlots.length === 0) return heuristic;

    const byDay = new Map<number, number[]>();
    for (const slot of topSlots.slice(0, 4)) {
      const hours = byDay.get(slot.dayOfWeek) ?? [];
      hours.push(slot.hour);
      byDay.set(slot.dayOfWeek, hours);
    }

    const statsWindows: AiBestPostingTimeWindow[] = [...byDay.entries()].map(
      ([dayOfWeek, hours]) => {
        const sorted = [...hours].sort((a, b) => a - b);
        const startHour = Math.max(0, sorted[0]! - 1);
        const endHour = Math.min(23, sorted[sorted.length - 1]! + 1);
        return {
          label: `${DAY_LABELS[dayOfWeek]} peak`,
          days: [DAY_LABELS[dayOfWeek]!],
          startHour,
          endHour,
        };
      },
    );

    return [...statsWindows, ...heuristic].slice(0, 4);
  }

  private confidence(sampleSize: number): AiBestPostingTimeConfidence {
    if (sampleSize >= STATS_GOOD_SAMPLE) return 'high';
    if (sampleSize >= STATS_MIN_SAMPLE * 2) return 'medium';
    return 'low';
  }

  private heuristicExplanation(family: CategoryFamily, sampleSize: number): string {
    const base =
      family === 'vehicles'
        ? 'For vehicles, Irish buyers often browse weekends and weekday evenings.'
        : family === 'property'
          ? 'For property-style listings, lunchtime and Sunday afternoons tend to work well.'
          : family === 'services'
            ? 'For services, weekday mornings and Sunday evenings are common planning windows.'
            : 'For general marketplace items, weekday evenings and Saturday mornings usually perform best.';

    if (sampleSize === 0) {
      return `${base} Not enough recent SellNearby chat/favourite activity in this category yet — showing Irish marketplace defaults (Europe/Dublin).`;
    }
    return `${base} Only ${sampleSize} recent engagement signals found — blending with Irish marketplace defaults (Europe/Dublin).`;
  }

  private statsExplanation(input: {
    family: CategoryFamily;
    sampleSize: number;
    topSlots: AiBestPostingTimeSlot[];
    source: AiBestPostingTimeSource;
  }): string {
    const top = input.topSlots[0];
    const lead = top
      ? `Strongest recent activity around ${top.label} (Europe/Dublin).`
      : 'Recent buyer activity found in this category.';
    const blend =
      input.source === 'hybrid'
        ? ' Combined with Irish marketplace defaults because the sample is still modest.'
        : '';
    return `${lead} Based on ${input.sampleSize} chat/favourite signals in the last ${LOOKBACK_DAYS} days.${blend}`;
  }

  private buildResult(input: {
    windows: AiBestPostingTimeWindow[];
    topSlots: AiBestPostingTimeSlot[];
    confidence: AiBestPostingTimeConfidence;
    sampleSize: number;
    source: AiBestPostingTimeSource;
    explanation: string;
    categoryId: string | null;
    categoryName: string | null;
  }): AiBestPostingTimeResult {
    return {
      timezone: 'Europe/Dublin',
      windows: input.windows,
      topSlots: input.topSlots,
      confidence: input.confidence,
      sampleSize: input.sampleSize,
      source: input.source,
      explanation: input.explanation,
      categoryId: input.categoryId,
      categoryName: input.categoryName,
      disclaimer: DISCLAIMER,
    };
  }

  private formatHour(hour: number): string {
    return `${String(hour).padStart(2, '0')}:00`;
  }
}
