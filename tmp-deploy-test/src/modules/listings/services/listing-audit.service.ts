import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type {
  ListingAuditEventType,
  ListingStatus,
} from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class ListingAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    listingId: string,
    eventType: ListingAuditEventType,
    actorId?: string,
    options?: {
      fromStatus?: ListingStatus;
      toStatus?: ListingStatus;
      metadata?: Record<string, unknown>;
    },
  ) {
    return this.prisma.listingAuditLog.create({
      data: {
        listingId,
        actorId,
        eventType,
        fromStatus: options?.fromStatus,
        toStatus: options?.toStatus,
        metadata: options?.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async listForListing(listingId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.listingAuditLog.findMany({
        where: { listingId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.listingAuditLog.count({ where: { listingId } }),
    ]);

    return {
      data: data.map((row) => ({
        id: row.id,
        listingId: row.listingId,
        actorId: row.actorId ?? undefined,
        eventType: row.eventType as ListingAuditEventType,
        fromStatus: row.fromStatus ?? undefined,
        toStatus: row.toStatus ?? undefined,
        metadata:
          (row.metadata as Record<string, unknown> | null) ?? undefined,
        createdAt: row.createdAt.toISOString(),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
