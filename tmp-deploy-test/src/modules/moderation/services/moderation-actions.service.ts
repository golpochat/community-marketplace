import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { ModerationAction, SuspensionDuration } from '@community-marketplace/types';
import { takeModerationActionSchema } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { JobQueueService } from '../../../jobs/job-queue.service';
import { mapModerationAction } from '../mappers/moderation.mapper';
import { ModerationAuditService } from './moderation-audit.service';
import { ModerationReportsService } from './moderation-reports.service';

function durationToMs(duration: SuspensionDuration): number | null {
  switch (duration) {
    case 'hours_24':
      return 24 * 60 * 60 * 1000;
    case 'days_7':
      return 7 * 24 * 60 * 60 * 1000;
    case 'days_30':
      return 30 * 24 * 60 * 60 * 1000;
    case 'permanent':
      return null;
    default:
      return null;
  }
}

@Injectable()
export class ModerationActionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly audit: ModerationAuditService,
    private readonly reports: ModerationReportsService,
    private readonly jobQueue: JobQueueService,
  ) {}

  async takeAction(reportId: string, adminId: string, input: unknown): Promise<ModerationAction> {
    const parsed = takeModerationActionSchema.parse(input);
    const report = await this.prisma.moderationReport.findUnique({
      where: { id: reportId },
      include: { listing: true, message: true, targetUser: true },
    });
    if (!report) throw new NotFoundException(`Report ${reportId} not found`);

    if (parsed.actionType === 'suspend' && !parsed.suspensionDuration) {
      throw new BadRequestException('suspensionDuration is required for suspend action');
    }

    const userId =
      report.targetUserId ??
      report.listing?.sellerId ??
      report.message?.senderId ??
      undefined;

    const expiresAt = parsed.suspensionDuration
      ? this.computeExpiresAt(parsed.suspensionDuration)
      : parsed.actionType === 'ban'
        ? null
        : undefined;

    const action = await this.prisma.moderationAction.create({
      data: {
        adminId,
        userId,
        listingId: report.listingId,
        messageId: report.messageId,
        reportId,
        actionType: parsed.actionType,
        suspensionDuration: parsed.suspensionDuration,
        notes: parsed.notes,
        expiresAt,
      },
    });

    await this.executeAction(adminId, parsed, report, userId, action.id);

    await this.reports.markActionTaken(reportId, adminId);

    const auditEvent = this.auditEventForAction(parsed.actionType);
    await this.audit.record(auditEvent, adminId, {
      reportId,
      userId,
      metadata: { actionId: action.id, actionType: parsed.actionType },
    });

    return mapModerationAction(action);
  }

  private async executeAction(
    adminId: string,
    parsed: ReturnType<typeof takeModerationActionSchema.parse>,
    report: {
      listingId: string | null;
      messageId: string | null;
      listing?: { id: string } | null;
    },
    userId: string | undefined,
    actionId: string,
  ) {
    switch (parsed.actionType) {
      case 'warn':
        if (userId) {
          this.eventBus.publish({
            type: 'moderation.user_warned',
            payload: {
              userId,
              message: parsed.warnMessage ?? parsed.notes ?? 'You received a warning from moderation.',
              reportId: report.listingId,
            },
            timestamp: new Date(),
          });
        }
        break;

      case 'suspend':
        if (userId) {
          await this.prisma.user.update({
            where: { id: userId },
            data: { status: 'suspended' },
          });
          await this.prisma.userBan.create({
            data: {
              userId,
              type: parsed.suspensionDuration === 'permanent' ? 'permanent' : 'temporary',
              reason: parsed.notes,
              bannedById: adminId,
              expiresAt: this.computeExpiresAt(parsed.suspensionDuration!),
            },
          });
          if (parsed.suspensionDuration && parsed.suspensionDuration !== 'permanent') {
            const delayMs =
              (this.computeExpiresAt(parsed.suspensionDuration)!.getTime() - Date.now());
            await this.jobQueue.enqueue({
              name: 'moderation.lift_suspension',
              payload: { userId, actionId, banCheck: true },
            });
            void this.scheduleInlineLift(userId, actionId, delayMs);
          }
          this.eventBus.publish({
            type: 'moderation.user_suspended',
            payload: { userId, duration: parsed.suspensionDuration, actionId },
            timestamp: new Date(),
          });
        }
        break;

      case 'ban':
        if (userId) {
          await this.prisma.userBan.create({
            data: {
              userId,
              type: 'permanent',
              reason: parsed.notes,
              bannedById: adminId,
            },
          });
          await this.prisma.user.update({
            where: { id: userId },
            data: { status: 'suspended' },
          });
          this.eventBus.publish({
            type: 'moderation.user_banned',
            payload: { userId, actionId },
            timestamp: new Date(),
          });
        }
        break;

      case 'delete_listing':
        if (report.listingId) {
          await this.prisma.listing.update({
            where: { id: report.listingId },
            data: { status: 'removed', moderationHiddenAt: null },
          });
        }
        break;

      case 'delete_message':
        if (report.messageId) {
          await this.prisma.chatMessage.update({
            where: { id: report.messageId },
            data: { deletedAt: new Date(), content: '[Message removed by moderation]' },
          });
        }
        break;
    }

    if (parsed.autoHideListing && report.listingId) {
      await this.prisma.listing.update({
        where: { id: report.listingId },
        data: { moderationHiddenAt: new Date() },
      });
    }
  }

  private computeExpiresAt(duration: SuspensionDuration): Date | null {
    const ms = durationToMs(duration);
    if (ms === null) return null;
    return new Date(Date.now() + ms);
  }

  private auditEventForAction(
    actionType: ReturnType<typeof takeModerationActionSchema.parse>['actionType'],
  ) {
    const map = {
      warn: 'action_warn',
      suspend: 'action_suspend',
      ban: 'action_ban',
      delete_listing: 'action_delete_listing',
      delete_message: 'action_delete_message',
    } as const;
    return map[actionType];
  }

  async liftSuspension(userId: string, actionId: string) {
    const action = await this.prisma.moderationAction.findUnique({ where: { id: actionId } });
    if (!action || action.liftedAt) return;

    await this.prisma.moderationAction.update({
      where: { id: actionId },
      data: { liftedAt: new Date() },
    });

    const activeBan = await this.prisma.userBan.findFirst({
      where: {
        userId,
        liftedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeBan && activeBan.type === 'temporary') {
      await this.prisma.userBan.update({
        where: { id: activeBan.id },
        data: { liftedAt: new Date() },
      });
    }

    const otherActiveBans = await this.prisma.userBan.count({
      where: {
        userId,
        liftedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (otherActiveBans === 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { status: 'active' },
      });
    }

    await this.audit.record('suspension_lifted', undefined, { userId, metadata: { actionId } });

    this.eventBus.publish({
      type: 'moderation.ban_lifted',
      payload: { userId, actionId },
      timestamp: new Date(),
    });
  }

  async listActions(filters?: { userId?: string; page?: number; limit?: number }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const where = filters?.userId ? { userId: filters.userId } : {};

    const [rows, total] = await Promise.all([
      this.prisma.moderationAction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.moderationAction.count({ where }),
    ]);

    return {
      data: rows.map(mapModerationAction),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async isUserBanned(userId: string): Promise<boolean> {
    const ban = await this.prisma.userBan.findFirst({
      where: {
        userId,
        liftedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    return Boolean(ban);
  }

  async listActiveBans() {
    const rows = await this.prisma.userBan.findMany({
      where: {
        liftedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        user: { select: { id: true, email: true, displayName: true } },
        bannedBy: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return rows.map((ban) => ({
      id: ban.id,
      userId: ban.userId,
      type: ban.type,
      reason: ban.reason,
      bannedById: ban.bannedById,
      expiresAt: ban.expiresAt?.toISOString(),
      createdAt: ban.createdAt.toISOString(),
      user: ban.user,
      bannedBy: ban.bannedBy,
    }));
  }

  private scheduleInlineLift(userId: string, actionId: string, delayMs: number) {
    if (delayMs <= 0 || delayMs > 31 * 24 * 60 * 60 * 1000) return;
    setTimeout(() => {
      void this.liftSuspension(userId, actionId);
    }, delayMs);
  }
}
