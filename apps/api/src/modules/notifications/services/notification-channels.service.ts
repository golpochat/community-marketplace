import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { NotificationPreferences } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { EmailService } from '../../../email/email.service';
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
    private readonly email: EmailService,
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

      const result = await this.delivery.deliverWithRetry(provider.id, input.notificationId, async () => {
        const sendResult = await this.email.send(
          {
            to: user.email,
            subject: input.title,
            html: `<p>${input.message}</p>`,
            text: input.message,
          },
          'EmailChannelService',
        );
        if (!sendResult.sent && sendResult.mode !== 'stub') {
          throw new Error('Email delivery failed');
        }
        return { provider: provider.name, mode: sendResult.mode, emailProvider: sendResult.provider };
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
