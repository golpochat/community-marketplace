import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { NotificationDeliveryStatus } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { mapLog, mapAdminDeliveryLog } from '../mappers/notification.mapper';

@Injectable()
export class NotificationDeliveryService {
  private readonly maxAttempts = 3;

  constructor(private readonly prisma: PrismaService) {}

  async logAttempt(input: {
    notificationId?: string;
    providerId: string;
    status: NotificationDeliveryStatus;
    response?: Record<string, unknown>;
    attempts?: number;
  }) {
    const row = await this.prisma.notificationLog.create({
      data: {
        notificationId: input.notificationId,
        providerId: input.providerId,
        status: input.status,
        response: input.response as Prisma.InputJsonValue | undefined,
        attempts: input.attempts ?? 1,
      },
    });
    return mapLog(row);
  }

  async deliverWithRetry<T>(
    providerId: string,
    notificationId: string | undefined,
    fn: () => Promise<T>,
  ): Promise<{ success: boolean; result?: T; error?: string }> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        const result = await fn();
        await this.logAttempt({
          notificationId,
          providerId,
          status: 'sent',
          response: { result: String(result) },
          attempts: attempt,
        });
        return { success: true, result };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Delivery failed';
        await this.logAttempt({
          notificationId,
          providerId,
          status: 'failed',
          response: { error: lastError },
          attempts: attempt,
        });
        if (attempt < this.maxAttempts) {
          await this.sleep(2 ** attempt * 250);
        }
      }
    }

    return { success: false, error: lastError };
  }

  async listLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.notificationLog.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          notification: {
            select: {
              type: true,
              title: true,
              channel: true,
              user: { select: { email: true, displayName: true } },
            },
          },
          provider: { select: { name: true, type: true } },
        },
      }),
      this.prisma.notificationLog.count(),
    ]);
    return {
      data: rows.map(mapAdminDeliveryLog),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
