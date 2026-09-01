import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { ModerationAppeal } from '@community-marketplace/types';
import {
  moderationAppealsQuerySchema,
  reviewAppealSchema,
  submitAppealSchema,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { mapModerationAppeal } from '../mappers/moderation.mapper';
import { ModerationActionsService } from './moderation-actions.service';
import { ModerationAuditService } from './moderation-audit.service';

@Injectable()
export class ModerationAppealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBusService,
    private readonly audit: ModerationAuditService,
    private readonly actions: ModerationActionsService,
  ) {}

  async submit(userId: string, input: unknown): Promise<ModerationAppeal> {
    const parsed = submitAppealSchema.parse(input);

    if (parsed.reportId) {
      const report = await this.prisma.moderationReport.findUnique({
        where: { id: parsed.reportId },
      });
      if (!report) throw new NotFoundException('Report not found');
      const isInvolved =
        report.reporterId === userId ||
        report.targetUserId === userId ||
        (report.listingId &&
          (await this.prisma.listing.findFirst({
            where: { id: report.listingId, sellerId: userId },
          })));
      if (!isInvolved) {
        throw new ForbiddenException('You cannot appeal this report');
      }
    }

    if (parsed.moderationActionId) {
      const action = await this.prisma.moderationAction.findUnique({
        where: { id: parsed.moderationActionId },
      });
      if (!action) throw new NotFoundException('Moderation action not found');
      if (action.userId !== userId) {
        throw new ForbiddenException('You cannot appeal this action');
      }
      if (action.actionType !== 'suspend' && action.actionType !== 'ban') {
        throw new BadRequestException('Only suspensions and bans can be appealed');
      }
    }

    const existing = await this.prisma.moderationAppeal.findFirst({
      where: {
        userId,
        status: 'pending',
        ...(parsed.reportId ? { reportId: parsed.reportId } : {}),
        ...(parsed.moderationActionId ? { moderationActionId: parsed.moderationActionId } : {}),
      },
    });
    if (existing) {
      throw new BadRequestException('A pending appeal already exists for this item');
    }

    const row = await this.prisma.moderationAppeal.create({
      data: {
        userId,
        reportId: parsed.reportId,
        moderationActionId: parsed.moderationActionId,
        message: parsed.message,
      },
    });

    await this.audit.record('appeal_submitted', userId, {
      reportId: parsed.reportId,
      userId,
      metadata: { appealId: row.id },
    });

    return mapModerationAppeal(row);
  }

  async list(query: unknown) {
    const parsed = moderationAppealsQuerySchema.parse(query ?? {});
    const where = {
      ...(parsed.status ? { status: parsed.status } : {}),
      ...(parsed.userId ? { userId: parsed.userId } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.moderationAppeal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parsed.page - 1) * parsed.limit,
        take: parsed.limit,
        include: {
          user: { select: { id: true, email: true, displayName: true } },
          report: true,
          moderationAction: true,
        },
      }),
      this.prisma.moderationAppeal.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        ...mapModerationAppeal(row),
        user: row.user,
        report: row.report,
        moderationAction: row.moderationAction,
      })),
      meta: {
        page: parsed.page,
        limit: parsed.limit,
        total,
        totalPages: Math.ceil(total / parsed.limit),
      },
    };
  }

  async getById(id: string) {
    const row = await this.prisma.moderationAppeal.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, displayName: true } },
        report: true,
        moderationAction: true,
        admin: { select: { id: true, email: true, displayName: true } },
      },
    });
    if (!row) throw new NotFoundException(`Appeal ${id} not found`);
    return {
      ...mapModerationAppeal(row),
      user: row.user,
      report: row.report,
      moderationAction: row.moderationAction,
      admin: row.admin,
    };
  }

  async review(appealId: string, adminId: string, input: unknown, canOverride = false) {
    const parsed = reviewAppealSchema.parse(input);
    const appeal = await this.prisma.moderationAppeal.findUnique({
      where: { id: appealId },
      include: { moderationAction: true },
    });
    if (!appeal) throw new NotFoundException(`Appeal ${appealId} not found`);
    if (appeal.status !== 'pending' && !canOverride) {
      throw new BadRequestException('Appeal has already been reviewed');
    }

    const row = await this.prisma.moderationAppeal.update({
      where: { id: appealId },
      data: {
        status: parsed.status,
        adminId,
        adminNotes: parsed.adminNotes,
      },
    });

    if (parsed.status === 'approved' && appeal.moderationActionId && appeal.moderationAction) {
      await this.actions.liftSuspension(appeal.userId, appeal.moderationActionId);
    }

    await this.audit.record(
      parsed.status === 'approved' ? 'appeal_approved' : 'appeal_rejected',
      adminId,
      { userId: appeal.userId, metadata: { appealId } },
    );

    this.eventBus.publish({
      type: 'moderation.appeal_decided',
      payload: {
        userId: appeal.userId,
        appealId,
        status: parsed.status,
        adminNotes: parsed.adminNotes,
      },
      timestamp: new Date(),
    });

    return mapModerationAppeal(row);
  }
}
