import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';
import { mapNotification } from '../mappers/notification.mapper';

@Injectable()
export class NotificationsCrudService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string, page = 1, limit = 20, unreadOnly = false) {
    const skip = (page - 1) * limit;
    const where = {
      userId,
      channel: 'in_app' as const,
      ...(unreadOnly ? { readAt: null } : {}),
    };

    const [rows, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: { userId, channel: 'in_app', readAt: null },
      }),
    ]);

    return {
      data: rows.map(mapNotification),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), unreadCount },
    };
  }

  async markRead(userId: string, notificationId: string) {
    const row = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!row) throw new NotFoundException('Notification not found');

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
    return mapNotification(updated);
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, channel: 'in_app', readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true };
  }

  async delete(userId: string, notificationId: string) {
    const row = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!row) throw new NotFoundException('Notification not found');
    await this.prisma.notification.delete({ where: { id: notificationId } });
    return { success: true };
  }

  getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, channel: 'in_app', readAt: null },
    });
  }

  async createRecord(input: {
    userId: string;
    type: string;
    title: string;
    message: string;
    channel: 'email' | 'push' | 'in_app';
    status: 'pending' | 'sent' | 'failed';
    actionUrl?: string;
    data?: Record<string, unknown>;
  }) {
    const row = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type as never,
        title: input.title,
        message: input.message,
        channel: input.channel,
        status: input.status,
        actionUrl: input.actionUrl,
        data: input.data as Prisma.InputJsonValue | undefined,
      },
    });
    return mapNotification(row);
  }
}
