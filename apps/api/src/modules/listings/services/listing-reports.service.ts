import { Injectable, NotFoundException } from '@nestjs/common';

import type { ListingReport } from '@community-marketplace/types';
import {
  listingModerationActionSchema,
  paginationSchema,
  reportListingSchema,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { ApiUtilsService } from '../../../utils/api-utils.service';
import { ListingLifecycleService } from './listing-lifecycle.service';

@Injectable()
export class ListingReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiUtils: ApiUtilsService,
    private readonly lifecycle: ListingLifecycleService,
    private readonly eventBus: EventBusService,
  ) {}

  async report(reporterId: string, listingId: string, input: unknown) {
    const parsed = reportListingSchema.parse(input);
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);

    const row = await this.prisma.listingReport.create({
      data: {
        listingId,
        reporterId,
        reason: parsed.reason,
        description: parsed.description,
      },
    });

    this.eventBus.publish({
      type: 'listing.reported',
      payload: { listingId, reportId: row.id },
      timestamp: new Date(),
    });

    return this.mapReport(row);
  }

  async listOpen(page = 1, limit = 20) {
    const { page: p, limit: l } = paginationSchema.parse({ page, limit });
    const where = { status: 'open' as const };

    const [rows, total] = await Promise.all([
      this.prisma.listingReport.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (p - 1) * l,
        take: l,
        include: {
          listing: { include: { seller: true, category: true } },
          reporter: true,
        },
      }),
      this.prisma.listingReport.count({ where }),
    ]);

    return this.apiUtils.paginate(
      rows.map((row) => ({
        ...this.mapReport(row),
        listing: {
          id: row.listing.id,
          title: row.listing.title,
          status: row.listing.status,
          sellerId: row.listing.sellerId,
        },
        reporter: {
          id: row.reporter.id,
          email: row.reporter.email,
        },
      })),
      p,
      l,
      total,
    );
  }

  async takeAction(
    reportId: string,
    moderatorId: string,
    input: unknown,
  ): Promise<ListingReport> {
    const parsed = listingModerationActionSchema.parse(input);
    const report = await this.prisma.listingReport.findUnique({
      where: { id: reportId },
      include: { listing: true },
    });
    if (!report) throw new NotFoundException(`Report ${reportId} not found`);

    if (parsed.action === 'ban_listing') {
      await this.lifecycle.ban(
        report.listingId,
        moderatorId,
        parsed.moderationNotes,
      );
    }

    const updated = await this.prisma.listingReport.update({
      where: { id: reportId },
      data: {
        status: parsed.action === 'dismiss' ? 'dismissed' : 'resolved',
        moderationNotes: parsed.moderationNotes,
        actionTaken: parsed.action,
        resolvedById: moderatorId,
        resolvedAt: new Date(),
      },
    });

    if (parsed.action === 'warn_seller' && parsed.warnMessage) {
      this.eventBus.publish({
        type: 'seller.warned',
        payload: {
          sellerId: report.listing.sellerId,
          listingId: report.listingId,
          message: parsed.warnMessage,
        },
        timestamp: new Date(),
      });
    }

    return this.mapReport(updated);
  }

  private mapReport(row: {
    id: string;
    listingId: string;
    reporterId: string;
    reason: string;
    description: string | null;
    status: string;
    moderationNotes: string | null;
    actionTaken: string | null;
    resolvedById: string | null;
    resolvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): ListingReport {
    return {
      id: row.id,
      listingId: row.listingId,
      reporterId: row.reporterId,
      reason: row.reason,
      description: row.description ?? undefined,
      status: row.status as ListingReport['status'],
      moderationNotes: row.moderationNotes ?? undefined,
      actionTaken: (row.actionTaken as ListingReport['actionTaken']) ?? undefined,
      resolvedById: row.resolvedById ?? undefined,
      resolvedAt: row.resolvedAt?.toISOString(),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
