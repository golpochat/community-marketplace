import { Injectable } from '@nestjs/common';

import type { AdminDashboardStats, PlatformSettings } from '@community-marketplace/types';

import { PrismaService } from '../../database/prisma.service';
import { EventBusService } from '../../events/event-bus.service';
import { RedisCacheService } from '../../libs/redis-cache.service';
import { ListingsService } from '../listings/listings.service';
import { ModerationService } from '../moderation/moderation.service';
import { UsersService } from '../users/users.service';
import { AdminAuditEntity } from './entities/admin-audit.entity';
import type { AdminActionDto, SuspendUserDto } from './dto/admin.dto';

const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  maintenanceMode: false,
  platformName: 'Community Marketplace',
  supportEmail: 'support@community-marketplace.local',
  defaultCurrency: 'USD',
  emailNotificationsEnabled: true,
  pushNotificationsEnabled: true,
  securityMfaRequired: false,
  paymentProvider: 'stripe',
};

@Injectable()
export class AdminService {
  private readonly auditLog: AdminAuditEntity[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: RedisCacheService,
    private readonly usersService: UsersService,
    private readonly listingsService: ListingsService,
    private readonly moderationService: ModerationService,
    private readonly eventBus: EventBusService,
  ) {}

  async getStats(): Promise<AdminDashboardStats> {
    const cacheKey = 'admin:dashboard:stats';
    const cached = await this.cache.get<AdminDashboardStats>(cacheKey);
    if (cached) return cached;

    const [
      totalUsers,
      totalSellers,
      totalBuyers,
      activeListings,
      totalPayments,
      pendingVerifications,
      reports,
      bans,
      revenueAgg,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { primaryRole: { code: 'SELLER' } } }),
      this.prisma.user.count({ where: { primaryRole: { code: 'BUYER' } } }),
      this.prisma.listing.count({ where: { status: 'active' } }),
      this.prisma.payment.count(),
      this.prisma.userVerification.count({ where: { status: 'pending' } }),
      this.moderationService.listReports({ page: 1, limit: 1, status: 'pending' }),
      this.moderationService.getBans(),
      this.prisma.payment.aggregate({
        where: { status: 'succeeded' },
        _sum: { amount: true },
      }),
    ]);

    const stats: AdminDashboardStats = {
      totalUsers,
      totalSellers,
      totalBuyers,
      activeListings,
      totalPayments,
      pendingVerifications,
      pendingReports: reports.meta.total,
      activeBans: Array.isArray(bans) ? bans.length : 0,
      revenue: revenueAgg._sum.amount?.toNumber() ?? 0,
      platformHealth: {
        database: 'healthy',
        search: process.env.MEILISEARCH_HOST ? 'healthy' : 'degraded',
        payments: process.env.STRIPE_SECRET_KEY ? 'healthy' : 'degraded',
      },
      generatedAt: new Date().toISOString(),
    };

    await this.cache.set(cacheKey, stats, 120);
    return stats;
  }

  async getPlatformSettings(): Promise<PlatformSettings> {
    const cached = await this.cache.get<PlatformSettings>('platform:settings');
    return cached ?? DEFAULT_PLATFORM_SETTINGS;
  }

  async updatePlatformSettings(settings: Partial<PlatformSettings>): Promise<PlatformSettings> {
    const current = await this.getPlatformSettings();
    const merged = { ...current, ...settings };
    await this.cache.set('platform:settings', merged, 0);
    await this.cache.del('admin:dashboard:stats');
    return merged;
  }

  getUsers(page = 1, limit = 20, query: Record<string, string | undefined> = {}) {
    return this.usersService.listUsers({ page, limit, ...query });
  }

  getListings(page = 1, limit = 20) {
    return this.listingsService.adminList({ page, limit });
  }

  getModerationReports(query?: unknown) {
    return this.moderationService.listReports(query);
  }

  getModerationBans() {
    return this.moderationService.getBans();
  }

  suspendUser(adminId: string, adminRole: 'ADMIN' | 'SUPER_ADMIN', dto: SuspendUserDto) {
    return this.usersService.suspendUser(adminId, adminRole, dto);
  }

  executeAction(adminId: string, dto: AdminActionDto) {
    this.logAction(adminId, dto.action, dto.targetType, dto.targetId, dto.metadata);
    this.eventBus.publish({
      type: 'admin.action',
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
    action: AdminAuditEntity['action'],
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
