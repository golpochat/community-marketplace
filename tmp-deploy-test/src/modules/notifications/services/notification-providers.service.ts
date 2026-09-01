import { Injectable, OnModuleInit } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { NotificationProviderType } from '@community-marketplace/types';
import type { NotificationProviderInput } from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { LoggerLib } from '../../../libs/logger.lib';
import { mapProvider } from '../mappers/notification.mapper';

const MAX_FAILURES_BEFORE_DISABLE = 5;

@Injectable()
export class NotificationProvidersService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerLib,
  ) {}

  async onModuleInit() {
    const defaults: NotificationProviderInput[] = [
      {
        name: 'stub-email',
        type: 'email',
        config: { mode: 'stub' },
        enabled: true,
      },
      {
        name: 'sendgrid',
        type: 'email',
        config: {
          mode: 'sendgrid',
          apiKeyEnv: 'SENDGRID_API_KEY',
          fromEmail: process.env.EMAIL_FROM ?? 'noreply@community.market',
        },
        enabled: Boolean(process.env.SENDGRID_API_KEY),
      },
      {
        name: 'stub-push',
        type: 'push',
        config: { mode: 'stub' },
        enabled: true,
      },
      {
        name: 'fcm',
        type: 'push',
        config: {
          mode: 'fcm',
          projectIdEnv: 'FCM_PROJECT_ID',
        },
        enabled: Boolean(process.env.FCM_PROJECT_ID),
      },
    ];

    for (const provider of defaults) {
      const existing = await this.prisma.notificationProvider.findUnique({
        where: { name: provider.name },
      });
      if (!existing) {
        await this.create(provider);
      }
    }
  }

  async create(input: NotificationProviderInput) {
    const row = await this.prisma.notificationProvider.create({
      data: {
        name: input.name,
        type: input.type,
        config: input.config as Prisma.InputJsonValue,
        enabled: input.enabled ?? true,
      },
    });
    return mapProvider(row);
  }

  async list() {
    const rows = await this.prisma.notificationProvider.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map(mapProvider);
  }

  async update(id: string, data: Partial<NotificationProviderInput>) {
    const row = await this.prisma.notificationProvider.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.type ? { type: data.type } : {}),
        ...(data.config ? { config: data.config as Prisma.InputJsonValue } : {}),
        ...(data.enabled !== undefined ? { enabled: data.enabled } : {}),
        ...(data.enabled ? { failureCount: 0, disabledAt: null } : {}),
      },
    });
    return mapProvider(row);
  }

  async getActiveProviders(type: NotificationProviderType) {
    return this.prisma.notificationProvider.findMany({
      where: { type, enabled: true },
      orderBy: { failureCount: 'asc' },
    });
  }

  async healthCheck(id: string) {
    const provider = await this.prisma.notificationProvider.findUnique({ where: { id } });
    if (!provider) return { healthy: false, reason: 'not_found' };
    if (!provider.enabled) return { healthy: false, reason: 'disabled' };
    return { healthy: true, failureCount: provider.failureCount };
  }

  async recordFailure(providerId: string, response?: Record<string, unknown>) {
    const provider = await this.prisma.notificationProvider.update({
      where: { id: providerId },
      data: { failureCount: { increment: 1 } },
    });

    if (provider.failureCount >= MAX_FAILURES_BEFORE_DISABLE && provider.enabled) {
      await this.prisma.notificationProvider.update({
        where: { id: providerId },
        data: { enabled: false, disabledAt: new Date() },
      });
      this.logger.log(
        'NotificationProvidersService',
        `Auto-disabled provider ${provider.name} after ${provider.failureCount} failures`,
      );
    }

    return response;
  }

  async recordSuccess(providerId: string) {
    await this.prisma.notificationProvider.update({
      where: { id: providerId },
      data: { failureCount: 0 },
    });
  }
}
