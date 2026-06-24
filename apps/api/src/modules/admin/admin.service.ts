import { Injectable } from '@nestjs/common';

import { EventBusService } from '../../events/event-bus.service';
import { ListingsService } from '../listings/listings.service';
import { ModerationService } from '../moderation/moderation.service';
import { UsersService } from '../users/users.service';
import { AdminAuditEntity } from './entities/admin-audit.entity';
import type { AdminActionDto, SuspendUserDto } from './dto/admin.dto';

@Injectable()
export class AdminService {
  private readonly auditLog: AdminAuditEntity[] = [];

  constructor(
    private readonly usersService: UsersService,
    private readonly listingsService: ListingsService,
    private readonly moderationService: ModerationService,
    private readonly eventBus: EventBusService,
  ) {}

  async getStats() {
    const users = await this.usersService.listUsers({ page: 1, limit: 1 });
    const listings = await this.listingsService.adminList({ page: 1, limit: 1, status: 'active' });
    const reports = this.moderationService.getReports();
    const bans = this.moderationService.getBans();

    return {
      totalUsers: users.meta.total,
      activeListings: listings.meta.total,
      pendingReports: reports.filter((r) => r.status === 'open').length,
      activeBans: bans.length,
      revenue: 0,
    };
  }

  getUsers(page = 1, limit = 20, query: Record<string, string | undefined> = {}) {
    return this.usersService.listUsers({ page, limit, ...query });
  }

  getListings(page = 1, limit = 20) {
    return this.listingsService.adminList({ page, limit });
  }

  getModerationReports() {
    return this.moderationService.getReports();
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
