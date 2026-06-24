import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { ModerationReport, ModerationReportDetail } from '@community-marketplace/types';
import {
  moderationReportFiltersSchema,
  moderationReportListingSchema,
  moderationReportMessageSchema,
  moderationReportUserSchema,
  updateReportNotesSchema,
  assignReportSchema,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { ApiUtilsService } from '../../../utils/api-utils.service';
import {
  mapModerationReport,
  mapModerationReportDetail,
} from '../mappers/moderation.mapper';
import { ModerationAuditService } from './moderation-audit.service';
import { ModerationAnalyticsService } from './moderation-analytics.service';
import { ModerationContentCheckService } from './moderation-content-check.service';

const reportInclude = {
  reporter: { select: { id: true, email: true, displayName: true } },
  targetUser: { select: { id: true, email: true, displayName: true } },
  listing: { select: { id: true, title: true, status: true, sellerId: true } },
  message: { select: { id: true, content: true, senderId: true, threadId: true } },
  admin: { select: { id: true, email: true, displayName: true } },
} satisfies Prisma.ModerationReportInclude;

@Injectable()
export class ModerationReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiUtils: ApiUtilsService,
    private readonly eventBus: EventBusService,
    private readonly contentCheck: ModerationContentCheckService,
    private readonly audit: ModerationAuditService,
    private readonly analytics: ModerationAnalyticsService,
  ) {}

  async reportUser(reporterId: string, input: unknown): Promise<ModerationReport> {
    const parsed = moderationReportUserSchema.parse(input);
    if (parsed.targetUserId === reporterId) {
      throw new BadRequestException('Cannot report yourself');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: parsed.targetUserId },
      select: { id: true },
    });
    if (!target) throw new NotFoundException('User not found');

    return this.createReport(reporterId, {
      targetUserId: parsed.targetUserId,
      reason: parsed.reason,
      description: parsed.description,
    });
  }

  async reportListing(reporterId: string, input: unknown): Promise<ModerationReport> {
    const parsed = moderationReportListingSchema.parse(input);
    const listing = await this.prisma.listing.findUnique({
      where: { id: parsed.listingId },
      select: { id: true, title: true, description: true, price: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    return this.createReport(reporterId, {
      listingId: parsed.listingId,
      reason: parsed.reason,
      description: parsed.description,
      listing,
    });
  }

  async reportMessage(reporterId: string, input: unknown): Promise<ModerationReport> {
    const parsed = moderationReportMessageSchema.parse(input);
    const message = await this.prisma.chatMessage.findUnique({
      where: { id: parsed.messageId },
      select: { id: true, content: true, senderId: true },
    });
    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId === reporterId) {
      throw new BadRequestException('Cannot report your own message');
    }

    return this.createReport(reporterId, {
      messageId: parsed.messageId,
      reason: parsed.reason,
      description: parsed.description,
      messageContent: message.content,
    });
  }

  private async createReport(
    reporterId: string,
    data: {
      targetUserId?: string;
      listingId?: string;
      messageId?: string;
      reason: ModerationReport['reason'];
      description?: string;
      listing?: { title: string; description: string; price: { toNumber(): number } };
      messageContent?: string;
    },
  ): Promise<ModerationReport> {
    const repeatWhere: Prisma.ModerationReportWhereInput = {
      status: 'pending',
      ...(data.targetUserId ? { targetUserId: data.targetUserId } : {}),
      ...(data.listingId ? { listingId: data.listingId } : {}),
      ...(data.messageId ? { messageId: data.messageId } : {}),
    };

    const repeatedCount = await this.prisma.moderationReport.count({ where: repeatWhere });

    const checkText = [
      data.description,
      data.listing?.title,
      data.listing?.description,
      data.messageContent,
    ]
      .filter(Boolean)
      .join(' ');

    const checkResult = await this.contentCheck.runFullCheck({
      text: checkText,
      price: data.listing ? data.listing.price.toNumber() : undefined,
      repeatedReportCount: repeatedCount + 1,
      reason: data.reason,
    });

    const row = await this.prisma.moderationReport.create({
      data: {
        reporterId,
        targetUserId: data.targetUserId,
        listingId: data.listingId,
        messageId: data.messageId,
        reason: data.reason,
        description: data.description,
        autoFlagged: checkResult.autoFlag,
        autoHidden: checkResult.autoHide,
      },
    });

    if (checkResult.autoHide && data.listingId) {
      await this.prisma.listing.update({
        where: { id: data.listingId },
        data: { moderationHiddenAt: new Date() },
      });
    }

    await this.audit.record('report_created', reporterId, {
      reportId: row.id,
      metadata: { autoFlagged: checkResult.autoFlag, reasons: checkResult.reasons },
    });

    if (checkResult.autoFlag) {
      await this.audit.record('auto_flag', undefined, {
        reportId: row.id,
        metadata: { reasons: checkResult.reasons },
      });
    }

    this.eventBus.publish({
      type: 'moderation.report_created',
      payload: {
        reportId: row.id,
        targetType: data.listingId ? 'listing' : data.messageId ? 'message' : 'user',
        autoFlagged: checkResult.autoFlag,
      },
      timestamp: new Date(),
    });

    void this.analytics.invalidateCache();

    return mapModerationReport(row);
  }

  async list(query: unknown) {
    const parsed = moderationReportFiltersSchema.parse(query ?? {});
    const where: Prisma.ModerationReportWhereInput = {
      ...(parsed.status ? { status: parsed.status } : {}),
      ...(parsed.reason ? { reason: parsed.reason } : {}),
      ...(parsed.adminId ? { adminId: parsed.adminId } : {}),
      ...(parsed.targetType === 'user' ? { targetUserId: { not: null }, listingId: null, messageId: null } : {}),
      ...(parsed.targetType === 'listing' ? { listingId: { not: null } } : {}),
      ...(parsed.targetType === 'message' ? { messageId: { not: null } } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.moderationReport.findMany({
        where,
        include: reportInclude,
        orderBy: { createdAt: 'desc' },
        skip: (parsed.page - 1) * parsed.limit,
        take: parsed.limit,
      }),
      this.prisma.moderationReport.count({ where }),
    ]);

    return this.apiUtils.paginate(
      rows.map((row) => mapModerationReportDetail(row)),
      parsed.page,
      parsed.limit,
      total,
    );
  }

  async getById(id: string): Promise<ModerationReportDetail> {
    const row = await this.prisma.moderationReport.findUnique({
      where: { id },
      include: reportInclude,
    });
    if (!row) throw new NotFoundException(`Report ${id} not found`);
    return mapModerationReportDetail(row);
  }

  async assignReport(reportId: string, adminId: string, input: unknown) {
    const parsed = assignReportSchema.parse(input);
    const report = await this.prisma.moderationReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException(`Report ${reportId} not found`);

    const row = await this.prisma.moderationReport.update({
      where: { id: reportId },
      data: { adminId: parsed.adminId, status: 'reviewed' },
      include: reportInclude,
    });

    await this.audit.record('report_assigned', adminId, {
      reportId,
      metadata: { assignedTo: parsed.adminId },
    });

    return mapModerationReportDetail(row);
  }

  async addNotes(reportId: string, adminId: string, input: unknown) {
    const parsed = updateReportNotesSchema.parse(input);
    const report = await this.prisma.moderationReport.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException(`Report ${reportId} not found`);

    const row = await this.prisma.moderationReport.update({
      where: { id: reportId },
      data: { notes: parsed.notes },
      include: reportInclude,
    });

    await this.audit.record('report_reviewed', adminId, { reportId, metadata: { notes: true } });
    return mapModerationReportDetail(row);
  }

  async markReviewed(reportId: string, adminId: string) {
    const row = await this.prisma.moderationReport.update({
      where: { id: reportId },
      data: { status: 'reviewed', adminId },
      include: reportInclude,
    });
    await this.audit.record('report_reviewed', adminId, { reportId });
    return mapModerationReportDetail(row);
  }

  async markActionTaken(reportId: string, adminId: string) {
    const row = await this.prisma.moderationReport.update({
      where: { id: reportId },
      data: { status: 'action_taken', adminId },
      include: reportInclude,
    });
    return mapModerationReportDetail(row);
  }
}
