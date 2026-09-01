import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { UserAuditEventType } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class UserAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    eventType: UserAuditEventType,
    actorId: string | undefined,
    targetUserId: string | undefined,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.userAuditLog.create({
      data: {
        eventType,
        actorId,
        targetUserId,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async listForAdmin(filters: {
    targetUserId?: string;
    eventType?: UserAuditEventType;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page ?? 1;
    const limit = Math.min(filters.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    const where = {
      ...(filters.targetUserId ? { targetUserId: filters.targetUserId } : {}),
      ...(filters.eventType ? { eventType: filters.eventType } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.userAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.userAuditLog.count({ where }),
    ]);

    return {
      data: data.map((row) => ({
        id: row.id,
        eventType: row.eventType as UserAuditEventType,
        actorId: row.actorId ?? undefined,
        targetUserId: row.targetUserId ?? undefined,
        metadata: (row.metadata as Record<string, unknown> | null) ?? undefined,
        createdAt: row.createdAt.toISOString(),
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
