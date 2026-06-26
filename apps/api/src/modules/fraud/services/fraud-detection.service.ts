import { Injectable } from '@nestjs/common';

import type { FraudSignalType } from '@community-marketplace/types';
import type { PaginatedResult } from '@community-marketplace/types';
import {
  fraudEscalateSchema,
  fraudListQuerySchema,
  fraudMarkSafeSchema,
  fraudSignalsQuerySchema,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { NotificationDispatcherService } from '../../notifications/services/notification-dispatcher.service';
import { ModerationContentCheckService } from '../../moderation/services/moderation-content-check.service';
import {
  detectListingFraudSignals,
  isNewSellerAccount,
  NEW_SELLER_DAILY_LISTING_LIMIT,
} from '../../listings/lib/listing-fraud.lib';
import {
  aggregateRiskScore,
  buildRiskBreakdown,
  mapFraudSignal,
  mapHighRiskListing,
  mapHighRiskUser,
} from '../mappers/fraud.mapper';
import { FraudRiskService } from './fraud-risk.service';
import { FraudSignalsService } from './fraud-signals.service';

const HIGH_RISK_KEYWORDS = [
  'wire transfer',
  'western union',
  'gift card',
  'crypto only',
  'whatsapp only',
  'telegram only',
  'cash app only',
  'verify account',
  'stolen',
  'replica',
  'counterfeit',
];

const LOCATION_MISMATCH_KM = 100;

@Injectable()
export class FraudDetectionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly signals: FraudSignalsService,
    private readonly risk: FraudRiskService,
    private readonly contentCheck: ModerationContentCheckService,
    private readonly notifications: NotificationDispatcherService,
  ) {}

  async recordAndEvaluate(input: {
    userId: string;
    listingId?: string;
    signalType: FraudSignalType;
    signalValue: string;
    riskScore?: number;
  }) {
    await this.signals.recordSignal(input);
    await this.risk.applyAutomatedActions(input.userId, input.listingId);
  }

  async onListingCreated(listingId: string, sellerId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        seller: {
          include: { profile: true },
        },
      },
    });
    if (!listing) return;

    const combined = `${listing.title} ${listing.description}`.toLowerCase();
    const keywordHits = HIGH_RISK_KEYWORDS.filter((kw) => combined.includes(kw));
    if (keywordHits.length) {
      await this.recordAndEvaluate({
        userId: sellerId,
        listingId,
        signalType: 'high_risk_keywords',
        signalValue: keywordHits.join(', '),
      });
    }

    const contentResult = this.contentCheck.checkText(combined);
    if (contentResult.flagged && contentResult.reasons.includes('scam_keywords')) {
      await this.recordAndEvaluate({
        userId: sellerId,
        listingId,
        signalType: 'high_risk_keywords',
        signalValue: contentResult.reasons.join(', '),
      });
    }

    const recentTitles = await this.prisma.listing.findMany({
      where: { sellerId, id: { not: listingId } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { title: true },
    });
    const dup = detectListingFraudSignals({
      title: listing.title,
      price: Number(listing.price),
      recentTitles: recentTitles.map((r) => r.title),
    });
    if (dup.reasons.some((r) => r.includes('copy-paste'))) {
      await this.recordAndEvaluate({
        userId: sellerId,
        listingId,
        signalType: 'repeated_listing_duplication',
        signalValue: listing.title,
      });
    }

    if (dup.reasons.some((r) => r.includes('low for a high-value'))) {
      await this.recordAndEvaluate({
        userId: sellerId,
        listingId,
        signalType: 'suspicious_pricing',
        signalValue: `Price ${listing.price} for "${listing.title}"`,
      });
    }

    const priceCheck = this.contentCheck.checkListingPrice(Number(listing.price));
    if (priceCheck.flagged) {
      await this.recordAndEvaluate({
        userId: sellerId,
        listingId,
        signalType: 'suspicious_pricing',
        signalValue: priceCheck.reasons.join(', '),
      });
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await this.prisma.listing.count({
      where: { sellerId, createdAt: { gte: oneHourAgo } },
    });
    if (recentCount >= 3) {
      await this.recordAndEvaluate({
        userId: sellerId,
        listingId,
        signalType: 'rapid_listing_creation',
        signalValue: `${recentCount} listings in the last hour`,
      });
    }

    const seller = listing.seller;
    const profile = seller.profile;
    if (
      profile?.latitude != null &&
      profile?.longitude != null &&
      this.haversineKm(
        Number(profile.latitude),
        Number(profile.longitude),
        Number(listing.latitude),
        Number(listing.longitude),
      ) > LOCATION_MISMATCH_KM
    ) {
      await this.recordAndEvaluate({
        userId: sellerId,
        listingId,
        signalType: 'mismatched_location',
        signalValue: `Listing location differs from seller profile by >${LOCATION_MISMATCH_KM}km`,
      });
    }

    if (isNewSellerAccount(seller.createdAt)) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayCount = await this.prisma.listing.count({
        where: { sellerId, createdAt: { gte: startOfDay } },
      });
      if (todayCount >= NEW_SELLER_DAILY_LISTING_LIMIT) {
        await this.recordAndEvaluate({
          userId: sellerId,
          listingId,
          signalType: 'rapid_listing_creation',
          signalValue: `${todayCount} listings created today (new seller)`,
        });
      }
    }
  }

  async onMessageSent(senderId: string, messageId: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { thread: { select: { listingId: true } } },
    });
    if (!message) return;

    const check = this.contentCheck.checkText(message.content);
    if (!check.flagged) return;

    await this.recordAndEvaluate({
      userId: senderId,
      listingId: message.thread.listingId ?? undefined,
      signalType: 'flagged_messages',
      signalValue: check.reasons.join(', '),
    });
  }

  async onMessageFlagged(senderId: string, messageId: string, reason: string) {
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: { thread: { select: { listingId: true } } },
    });

    await this.recordAndEvaluate({
      userId: senderId,
      listingId: message?.thread.listingId ?? undefined,
      signalType: 'flagged_messages',
      signalValue: reason,
    });
  }

  async onAccountCreated(userId: string, deviceFingerprint?: string) {
    if (!deviceFingerprint) return;

    const others = await this.prisma.authSession.findMany({
      where: {
        deviceFingerprint,
        userId: { not: userId },
        revokedAt: null,
      },
      distinct: ['userId'],
      select: { userId: true },
      take: 5,
    });

    if (others.length > 0) {
      await this.recordAndEvaluate({
        userId,
        signalType: 'multiple_accounts_same_device',
        signalValue: `Shared device fingerprint with ${others.length} other account(s)`,
      });
    }
  }

  async onVerificationSubmitted(userId: string) {
    const recentSignals = await this.signals.getActiveSignalsForUser(userId);
    const riskScore = aggregateRiskScore(recentSignals);
    if (riskScore >= 21) {
      await this.recordAndEvaluate({
        userId,
        signalType: 'buyer_reports',
        signalValue: `Verification submitted with existing risk score ${riskScore}`,
        riskScore: 10,
      });
    }
  }

  async onBuyerReport(
    targetUserId: string,
    listingId: string | undefined,
    reasons: string[],
  ) {
    await this.recordAndEvaluate({
      userId: targetUserId,
      listingId,
      signalType: 'buyer_reports',
      signalValue: reasons.join(', ') || 'user_report',
    });
  }

  async listHighRiskUsers(query: Record<string, string>) {
    const parsed = fraudListQuerySchema.parse(query);
    const minRisk = parsed.minRiskScore ?? 51;
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const grouped = await this.prisma.fraudSignal.groupBy({
      by: ['userId'],
      where: { dismissedAt: null, createdAt: { gte: since } },
      _sum: { riskScore: true },
      _max: { createdAt: true },
      orderBy: { _sum: { riskScore: 'desc' } },
    });

    const filtered = grouped.filter((row) => Math.min(100, row._sum.riskScore ?? 0) >= minRisk);
    const pageRows = filtered.slice((parsed.page - 1) * parsed.limit, parsed.page * parsed.limit);

    const users = await this.prisma.user.findMany({
      where: { id: { in: pageRows.map((r) => r.userId) } },
      select: { id: true, displayName: true, email: true, sellerStatus: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const data = await Promise.all(
      pageRows.map(async (row) => {
        const signals = await this.signals.getActiveSignalsForUser(row.userId);
        const user = userMap.get(row.userId);
        if (!user) return null;
        return mapHighRiskUser(user, signals);
      }),
    );

    return {
      data: data.filter(Boolean),
      meta: { page: parsed.page, limit: parsed.limit, total: filtered.length },
    } as PaginatedResult<ReturnType<typeof mapHighRiskUser>>;
  }

  async listHighRiskListings(query: Record<string, string>) {
    const parsed = fraudListQuerySchema.parse(query);
    const minRisk = parsed.minRiskScore ?? 51;
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const grouped = await this.prisma.fraudSignal.groupBy({
      by: ['listingId'],
      where: {
        dismissedAt: null,
        listingId: { not: null },
        createdAt: { gte: since },
      },
      _sum: { riskScore: true },
      orderBy: { _sum: { riskScore: 'desc' } },
    });

    const filtered = grouped
      .filter((row) => row.listingId && Math.min(100, row._sum.riskScore ?? 0) >= minRisk)
      .map((row) => row.listingId!);

    const pageIds = filtered.slice((parsed.page - 1) * parsed.limit, parsed.page * parsed.limit);

    const listings = await this.prisma.listing.findMany({
      where: { id: { in: pageIds } },
      include: { seller: { select: { displayName: true } } },
    });
    const listingMap = new Map(listings.map((l) => [l.id, l]));

    const data = await Promise.all(
      pageIds.map(async (listingId) => {
        const listing = listingMap.get(listingId);
        if (!listing) return null;
        const signals = await this.signals.getActiveSignalsForListing(listingId);
        return mapHighRiskListing(listing, signals);
      }),
    );

    return {
      data: data.filter(Boolean),
      meta: { page: parsed.page, limit: parsed.limit, total: filtered.length },
    } as PaginatedResult<ReturnType<typeof mapHighRiskListing>>;
  }

  async listSignals(query: Record<string, string>) {
    const parsed = fraudSignalsQuerySchema.parse(query);
    const where = {
      ...(parsed.userId ? { userId: parsed.userId } : {}),
      ...(parsed.listingId ? { listingId: parsed.listingId } : {}),
      ...(parsed.signalType ? { signalType: parsed.signalType } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.fraudSignal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parsed.page - 1) * parsed.limit,
        take: parsed.limit,
      }),
      this.prisma.fraudSignal.count({ where }),
    ]);

    return {
      data: rows.map(mapFraudSignal),
      meta: { page: parsed.page, limit: parsed.limit, total },
    };
  }

  async getUserRiskBreakdown(userId: string) {
    const signals = await this.signals.getActiveSignalsForUser(userId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, displayName: true, email: true, sellerStatus: true },
    });
    if (!user) return null;

    return {
      ...mapHighRiskUser(user, signals),
      breakdown: buildRiskBreakdown(
        signals.map((s) => ({
          signalType: s.signalType as FraudSignalType,
          riskScore: s.riskScore,
        })),
      ),
    };
  }

  async markSafe(adminId: string, input: unknown) {
    const parsed = fraudMarkSafeSchema.parse(input);
    const now = new Date();

    const where = {
      userId: parsed.userId,
      dismissedAt: null,
      ...(parsed.listingId ? { listingId: parsed.listingId } : {}),
      ...(parsed.signalIds?.length ? { id: { in: parsed.signalIds } } : {}),
    };

    const result = await this.prisma.fraudSignal.updateMany({
      where,
      data: { dismissedAt: now },
    });

    if (parsed.notes) {
      await this.notifications.dispatch({
        userId: parsed.userId,
        type: 'admin_warning',
        templateKey: 'admin_warning',
        variables: { message: parsed.notes },
      });
    }

    return { dismissed: result.count, markedBy: adminId };
  }

  async escalate(adminId: string, input: unknown) {
    const parsed = fraudEscalateSchema.parse(input);
    const now = new Date();

    await this.prisma.fraudSignal.updateMany({
      where: {
        userId: parsed.userId,
        dismissedAt: null,
        ...(parsed.listingId ? { listingId: parsed.listingId } : {}),
      },
      data: { escalatedAt: now },
    });

    const riskScore = await this.signals.computeUserRiskScore(parsed.userId);
    await this.risk.applyAutomatedActions(parsed.userId, parsed.listingId);

    const admins = await this.prisma.user.findMany({
      where: { primaryRole: { code: { in: ['ADMIN', 'SUPER_ADMIN'] } }, status: 'active' },
      select: { id: true },
      take: 20,
    });

    const note =
      parsed.notes?.trim() ||
      `Fraud case escalated by admin (risk score ${riskScore}).`;

    await Promise.all(
      admins.map((admin) =>
        this.notifications.dispatch({
          userId: admin.id,
          type: 'admin_warning',
          templateKey: 'admin_warning',
          variables: { message: note },
          actionUrl: '/admin/fraud',
          data: { userId: parsed.userId, listingId: parsed.listingId, escalatedBy: adminId },
        }),
      ),
    );

    return { escalated: true, riskScore };
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const r = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * r * Math.asin(Math.sqrt(a));
  }
}
