import { Injectable } from "@nestjs/common";

import type {
  AdminDashboardStats,
  ListingReviewContext,
  PlatformGovernanceStatus,
  RbacRole,
} from "@community-marketplace/types";
import type { PlatformGovernanceUpdateInput, AdminActionInput } from "@community-marketplace/validation";
import {
  SALE_CLOSE_KPI_WINDOW_DAYS,
  summarizeSaleCloseEvents,
} from "@community-marketplace/utils";

import { PrismaService } from "../../database/prisma.service";
import { EventBusService } from "../../events/event-bus.service";
import { RedisCacheService } from "../../libs/redis-cache.service";
import { ListingsService } from "../listings/listings.service";
import { ModerationService } from "../moderation/moderation.service";
import { PlatformGovernanceService } from "../platform/platform-governance.service";
import { UsersService } from "../users/users.service";
import { AdminAuditEntity } from "./entities/admin-audit.entity";

@Injectable()
export class AdminService {
  private readonly auditLog: AdminAuditEntity[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
    private readonly governance: PlatformGovernanceService,
    private readonly usersService: UsersService,
    private readonly listingsService: ListingsService,
    private readonly moderationService: ModerationService,
    private readonly eventBus: EventBusService,
  ) {}

  async getStats(): Promise<AdminDashboardStats> {
    const cacheKey = "admin:dashboard:stats:v2";
    const cached = await this.cache.get<AdminDashboardStats>(cacheKey);
    if (cached) return cached;

    const [
      totalUsers,
      totalSellers,
      totalBuyers,
      activeListings,
      totalPayments,
      pendingVerifications,
      pendingFastTrack,
      overdueFastTrack,
      reports,
      bans,
      revenueAgg,
      soldCloseLogs,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          OR: [
            { primaryRole: { code: "SELLER" } },
            {
              primaryRole: { code: "MEMBER" },
              OR: [
                { verificationRequestedAt: { not: null } },
                { listings: { some: {} } },
                {
                  sellerStatus: {
                    in: ["verified", "under_review", "suspended"],
                  },
                },
              ],
            },
          ],
        },
      }),
      this.prisma.user.count({ where: { primaryRole: { code: "BUYER" } } }),
      this.prisma.listing.count({ where: { status: "active" } }),
      this.prisma.payment.count(),
      // Live seller KYC queue (wizard) — not legacy user_verifications.
      this.prisma.sellerVerificationRequest.count({
        where: {
          status: "pending",
          user: {
            primaryRole: { code: { in: ["SELLER", "MEMBER"] } },
            verificationRequestedAt: { not: null },
            sellerStatus: { notIn: ["verified"] },
          },
        },
      }),
      this.prisma.sellerVerificationRequest.count({
        where: {
          status: "pending",
          priority: true,
          user: {
            primaryRole: { code: { in: ["SELLER", "MEMBER"] } },
            verificationRequestedAt: { not: null },
            sellerStatus: { notIn: ["verified"] },
          },
        },
      }),
      this.prisma.sellerVerificationRequest.count({
        where: {
          status: "pending",
          priority: true,
          slaDueAt: { lt: new Date() },
          user: {
            primaryRole: { code: { in: ["SELLER", "MEMBER"] } },
            verificationRequestedAt: { not: null },
            sellerStatus: { notIn: ["verified"] },
          },
        },
      }),
      this.moderationService.listReports({
        page: 1,
        limit: 1,
        status: "pending",
      }),
      this.moderationService.getBans(),
      this.prisma.payment.aggregate({
        where: { status: "succeeded" },
        _sum: { amount: true },
      }),
      this.prisma.listingAuditLog.findMany({
        where: {
          eventType: "status_changed",
          toStatus: "sold",
          createdAt: {
            gte: new Date(
              Date.now() - SALE_CLOSE_KPI_WINDOW_DAYS * 24 * 60 * 60 * 1000,
            ),
          },
        },
        orderBy: { createdAt: "desc" },
        select: {
          listingId: true,
          metadata: true,
          listing: { select: { price: true } },
        },
      }),
    ]);

    const seenSoldListings = new Set<string>();
    const saleCloseEvents: Array<{ closeChannel?: unknown; listedPrice: number }> = [];
    for (const row of soldCloseLogs) {
      if (seenSoldListings.has(row.listingId)) continue;
      seenSoldListings.add(row.listingId);
      const metadata =
        row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
          ? (row.metadata as Record<string, unknown>)
          : {};
      saleCloseEvents.push({
        closeChannel: metadata.closeChannel,
        listedPrice: Number(row.listing.price),
      });
    }

    const stats: AdminDashboardStats = {
      totalUsers,
      totalSellers,
      totalBuyers,
      activeListings,
      totalPayments,
      pendingVerifications,
      pendingFastTrackVerifications: pendingFastTrack,
      overdueFastTrackVerifications: overdueFastTrack,
      pendingReports: reports.meta.total,
      activeBans: Array.isArray(bans) ? bans.length : 0,
      revenue: revenueAgg._sum.amount?.toNumber() ?? 0,
      saleCloseKpi: summarizeSaleCloseEvents(saleCloseEvents),
      platformHealth: {
        database: "healthy",
        search: process.env.MEILISEARCH_HOST ? "healthy" : "degraded",
        payments: process.env.STRIPE_SECRET_KEY ? "healthy" : "degraded",
      },
      generatedAt: new Date().toISOString(),
    };

    await this.cache.set(cacheKey, stats, 120);
    return stats;
  }

  async getPlatformSettings(): Promise<PlatformGovernanceStatus> {
    return this.governance.getStatus();
  }

  async updatePlatformSettings(
    settings: PlatformGovernanceUpdateInput,
  ): Promise<PlatformGovernanceStatus> {
    await this.governance.update(settings);
    await this.cache.del("admin:dashboard:stats:v2");
    return this.governance.getStatus();
  }

  getUsers(
    page = 1,
    limit = 20,
    query: Record<string, string | undefined> = {},
    actorRole: RbacRole = "ADMIN",
  ) {
    return this.usersService.listUsers({ page, limit, ...query }, actorRole);
  }

  getListings(page = 1, limit = 20) {
    return this.listingsService.adminList({ page, limit });
  }

  approveListing(listingId: string, adminId: string) {
    return this.listingsService.approve(listingId, adminId);
  }

  rejectListing(listingId: string, adminId: string, body: unknown) {
    return this.listingsService.rejectListing(listingId, adminId, body);
  }

  removeListing(listingId: string, adminId: string, body: unknown) {
    return this.listingsService.removeListing(listingId, adminId, body);
  }

  restoreListing(listingId: string, adminId: string, body: unknown) {
    return this.listingsService.restoreListing(listingId, adminId, body);
  }

  getListingStatusHistory(listingId: string) {
    return this.listingsService.getStatusHistory(listingId);
  }

  getListingReview(
    listingId: string,
    actorId: string,
    role: RbacRole,
  ): Promise<ListingReviewContext> {
    return this.listingsService.getReviewContext(listingId, actorId, role);
  }

  addListingReviewMessage(
    listingId: string,
    actorId: string,
    role: RbacRole,
    body: unknown,
  ): Promise<ListingReviewContext> {
    return this.listingsService.addReviewMessage(
      listingId,
      actorId,
      role,
      body,
    );
  }

  requestListingChanges(
    listingId: string,
    adminId: string,
    role: RbacRole,
    body: unknown,
  ): Promise<ListingReviewContext> {
    return this.listingsService.requestListingChanges(
      listingId,
      adminId,
      role,
      body,
    );
  }

  getModerationReports(query?: unknown) {
    return this.moderationService.listReports(query);
  }

  getModerationBans() {
    return this.moderationService.getBans();
  }

  suspendUser(
    adminId: string,
    adminRole: "ADMIN" | "SUPER_ADMIN",
    dto: unknown,
  ) {
    return this.usersService.suspendUser(adminId, adminRole, dto);
  }

  executeAction(adminId: string, dto: AdminActionInput) {
    this.logAction(
      adminId,
      dto.action,
      dto.targetType,
      dto.targetId,
      dto.metadata,
    );
    this.eventBus.publish({
      type: "admin.action",
      payload: { adminId, ...dto },
      timestamp: new Date(),
    });
    return { executed: true, action: dto.action };
  }

  getAuditLog() {
    return this.auditLog;
  }

  private logAction(
    adminId: string,
    action: AdminAuditEntity["action"],
    targetType: string,
    targetId: string,
    metadata?: Record<string, unknown>,
  ) {
    const entry = new AdminAuditEntity();
    entry.id = `audit-${Date.now()}`;
    entry.adminId = adminId;
    entry.action = action;
    entry.targetType = targetType;
    entry.targetId = targetId;
    entry.metadata = metadata;
    entry.createdAt = new Date();
    entry.updatedAt = new Date();
    this.auditLog.unshift(entry);
  }
}
