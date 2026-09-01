import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { ModerationAuditEventType } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { mapModerationAuditLog } from '../mappers/moderation.mapper';

@Injectable()
export class ModerationAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    eventType: ModerationAuditEventType,
    actorId: string | undefined,
    options?: {
      reportId?: string;
      userId?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const row = await this.prisma.moderationAuditLog.create({
      data: {
        eventType,
        actorId,
        reportId: options?.reportId,
        userId: options?.userId,
        metadata: options?.metadata as Prisma.InputJsonValue | undefined,
      },
    });
    return mapModerationAuditLog(row);
  }

  async list(filters?: { reportId?: string; userId?: string; page?: number; limit?: number }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const where = {
      ...(filters?.reportId ? { reportId: filters.reportId } : {}),
      ...(filters?.userId ? { userId: filters.userId } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.moderationAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.moderationAuditLog.count({ where }),
    ]);

    return {
      data: rows.map(mapModerationAuditLog),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
