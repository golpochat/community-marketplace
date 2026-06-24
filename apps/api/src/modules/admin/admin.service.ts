import { Injectable } from '@nestjs/common';

import type { Listing } from '@community-marketplace/types';

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

  getStats() {
    const users = this.usersService.findAll(1, 1000);
    const listings = this.listingsService.findAll(1, 1000);
    const reports = this.moderationService.getReports();
    const bans = this.moderationService.getBans();

    return {
      totalUsers: users.meta.total,
      activeListings: (listings.data as Listing[]).filter((l) => l.status === 'active').length,
      pendingReports: reports.filter((r) => r.status === 'open').length,
      activeBans: bans.length,
      revenue: 0,
    };
  }

  getUsers(page = 1, limit = 20) {
    return this.usersService.findAll(page, limit);
  }

  getListings(page = 1, limit = 20) {
    return this.listingsService.findAll(page, limit);
  }

  suspendUser(adminId: string, dto: SuspendUserDto) {
    this.logAction(adminId, 'user_suspend', 'user', dto.userId, { reason: dto.reason });
    return { userId: dto.userId, status: 'suspended' };
  }

  approveListing(adminId: string, listingId: string) {
    const listing = this.listingsService.update(listingId, { status: 'active' });
    this.logAction(adminId, 'listing_approve', 'listing', listingId);
    return listing;
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
