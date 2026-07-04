import { Injectable } from '@nestjs/common';

import type {
  DispatchNotificationInput,
  NotificationChannel,
} from '@community-marketplace/types';

import { EventBusService } from '../../../events/event-bus.service';
import { PlatformGovernanceService } from '../../platform/platform-governance.service';
import { PrismaService } from '../../../database/prisma.service';
import {
  EmailChannelService,
  InAppChannelService,
  PushChannelService,
} from './notification-channels.service';
import { NotificationPreferencesService } from './notification-preferences.service';
import { NotificationRateLimitService } from './notification-rate-limit.service';
import { NotificationTemplateEngineService } from './notification-template-engine.service';
import { NotificationTemplatesService } from './notification-templates.service';
import { NotificationsCrudService } from './notifications-crud.service';

@Injectable()
export class NotificationDispatcherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: NotificationTemplatesService,
    private readonly engine: NotificationTemplateEngineService,
    private readonly preferences: NotificationPreferencesService,
    private readonly rateLimit: NotificationRateLimitService,
    private readonly inApp: InAppChannelService,
    private readonly push: PushChannelService,
    private readonly email: EmailChannelService,
    private readonly crud: NotificationsCrudService,
    private readonly eventBus: EventBusService,
    private readonly governance: PlatformGovernanceService,
  ) {}

  async dispatch(input: DispatchNotificationInput) {
    if (!(await this.rateLimit.checkUserLimit(input.userId))) {
      return { dispatched: false, reason: 'rate_limited' };
    }

    const prefs = await this.preferences.get(input.userId);
    const channels = this.preferences.resolveChannels(prefs, input.channels);

    const results: Record<string, unknown> = {};

    for (const channel of channels) {
      if (!(await this.preferences.shouldSend(input.userId, channel, input.type))) {
        results[channel] = { skipped: true, reason: 'preferences' };
        continue;
      }

      let title = input.variables?.title ?? '';
      let message = input.variables?.message ?? '';

      try {
        const template = await this.templates.getLatest(input.templateKey, channel);
        const rendered = this.engine.preview(
          template.titleTemplate,
          template.bodyTemplate,
          input.variables ?? {},
        );
        title = rendered.title;
        message = rendered.message;
      } catch {
        if (!title || !message) {
          results[channel] = { skipped: true, reason: 'no_template' };
          continue;
        }
      }

      if (channel === 'in_app') {
        const result = await this.inApp.send({
          userId: input.userId,
          type: input.type,
          title,
          message,
          actionUrl: input.actionUrl,
          data: input.data,
        });
        results.in_app = result;
        this.publishSent(result.notification?.id, input.userId);
        continue;
      }

      const record = await this.crud.createRecord({
        userId: input.userId,
        type: input.type,
        title,
        message,
        channel,
        status: 'pending',
        actionUrl: input.actionUrl,
        data: input.data,
      });

      const payload = {
        userId: input.userId,
        notificationId: record.id,
        title,
        message,
        actionUrl: input.actionUrl,
        data: input.data,
      };

      if (channel === 'push') {
        if (!(await this.governance.arePushNotificationsEnabled())) {
          results.push = { skipped: true, reason: 'platform_disabled' };
          await this.updateStatus(record.id, 'failed');
          continue;
        }
        const pushResult = await this.push.send(payload);
        results.push = pushResult;
        await this.updateStatus(record.id, pushResult.sent ? 'sent' : 'failed');
      }

      if (channel === 'email') {
        if (!(await this.governance.areEmailNotificationsEnabled())) {
          results.email = { skipped: true, reason: 'platform_disabled' };
          await this.updateStatus(record.id, 'failed');
          continue;
        }
        const emailResult = await this.email.send(payload);
        results.email = emailResult;
        await this.updateStatus(record.id, emailResult.sent ? 'sent' : 'failed');
      }

      this.publishSent(record.id, input.userId);
    }

    return { dispatched: true, results };
  }

  async broadcast(input: {
    title: string;
    message: string;
    type?: DispatchNotificationInput['type'];
    role?: 'BUYER' | 'SELLER' | 'ADMIN';
    userIds?: string[];
    channels?: NotificationChannel[];
  }) {
    let userIds = input.userIds ?? [];
    if (!userIds.length && input.role) {
      const users = await this.prisma.user.findMany({
        where: { primaryRole: { code: input.role } },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    }

    const outcomes = [];
    for (const userId of userIds) {
      outcomes.push(
        await this.dispatch({
          userId,
          type: input.type ?? 'system',
          templateKey: 'admin_broadcast',
          variables: { title: input.title, message: input.message },
          channels: input.channels ?? ['in_app', 'push'],
        }),
      );
    }

    return { recipients: userIds.length, outcomes };
  }

  private async updateStatus(notificationId: string, status: 'sent' | 'failed') {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status },
    });
  }

  private publishSent(notificationId: string | undefined, userId: string) {
    if (!notificationId) return;
    this.eventBus.publish({
      type: 'notification.sent',
      payload: { notificationId, userId },
      timestamp: new Date(),
    });
  }
}
