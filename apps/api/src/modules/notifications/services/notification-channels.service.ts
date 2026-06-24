import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { NotificationPreferences } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { LoggerLib } from '../../../libs/logger.lib';
import { mapNotification } from '../mappers/notification.mapper';
import { NotificationDeliveryService } from './notification-delivery.service';
import { NotificationProvidersService } from './notification-providers.service';
import { NotificationRateLimitService } from './notification-rate-limit.service';

export interface ChannelSendInput {
  userId: string;
  notificationId?: string;
  title: string;
  message: string;
  actionUrl?: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class EmailChannelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: NotificationProvidersService,
    private readonly delivery: NotificationDeliveryService,
    private readonly rateLimit: NotificationRateLimitService,
    private readonly logger: LoggerLib,
  ) {}

  async send(input: ChannelSendInput) {
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true },
    });
    if (!user?.email) return { sent: false, reason: 'no_email' };

    const activeProviders = await this.providers.getActiveProviders('email');
    for (const provider of activeProviders) {
      if (!(await this.rateLimit.checkProviderLimit(provider.id))) continue;

      const config = provider.config as Record<string, unknown>;
      const result = await this.delivery.deliverWithRetry(provider.id, input.notificationId, async () => {
        if (config.mode === 'sendgrid' && process.env.SENDGRID_API_KEY) {
          const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              personalizations: [{ to: [{ email: user.email }] }],
              from: { email: String(config.fromEmail ?? process.env.EMAIL_FROM ?? 'noreply@community.market') },
              subject: input.title,
              content: [{ type: 'text/plain', value: input.message }],
            }),
          });
          if (!response.ok) throw new Error(`SendGrid error: ${response.status}`);
          return { provider: provider.name };
        }

        this.logger.log('EmailChannelService', `[stub] Email to ${user.email}: ${input.title}`);
        return { provider: provider.name, mode: 'stub' };
      });

      if (result.success) {
        await this.providers.recordSuccess(provider.id);
        return { sent: true, provider: provider.name };
      }
      await this.providers.recordFailure(provider.id, { error: result.error });
    }

    return { sent: false, reason: 'all_providers_failed' };
  }
}

@Injectable()
export class PushChannelService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providers: NotificationProvidersService,
    private readonly delivery: NotificationDeliveryService,
    private readonly rateLimit: NotificationRateLimitService,
    private readonly logger: LoggerLib,
  ) {}

  async send(input: ChannelSendInput) {
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId: input.userId, isActive: true },
      select: { token: true },
    });
    if (!tokens.length) return { sent: false, reason: 'no_tokens' };

    const activeProviders = await this.providers.getActiveProviders('push');
    for (const provider of activeProviders) {
      if (!(await this.rateLimit.checkProviderLimit(provider.id))) continue;

      const result = await this.delivery.deliverWithRetry(provider.id, input.notificationId, async () => {
        for (const { token } of tokens) {
          this.logger.log(
            'PushChannelService',
            `[${provider.name}] Push to ${token.slice(0, 12)}... — ${input.title}`,
          );
        }
        return { sent: tokens.length, provider: provider.name };
      });

      if (result.success) {
        await this.providers.recordSuccess(provider.id);
        return { sent: true, provider: provider.name, count: tokens.length };
      }
      await this.providers.recordFailure(provider.id, { error: result.error });
    }

    return { sent: false, reason: 'all_providers_failed' };
  }
}

@Injectable()
export class InAppChannelService {
  constructor(private readonly prisma: PrismaService) {}

  async send(
    input: ChannelSendInput & {
      type: string;
      status?: 'pending' | 'sent' | 'failed';
    },
  ) {
    const row = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type as never,
        title: input.title,
        message: input.message,
        data: input.data as Prisma.InputJsonValue | undefined,
        channel: 'in_app',
        status: input.status ?? 'sent',
        actionUrl: input.actionUrl,
      },
    });
    return { sent: true, notification: mapNotification(row) };
  }
}
