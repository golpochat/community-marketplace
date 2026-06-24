import { Injectable, NotFoundException } from '@nestjs/common';

import type { Notification } from '@community-marketplace/types';

import { EventBusService } from '../../events/event-bus.service';
import { NotificationEntity } from './entities/notification.entity';
import type { SendNotificationDto } from './dto/notifications.dto';
import { DeviceTokenService, FcmService } from './services/fcm.service';

@Injectable()
export class NotificationsService {
  private readonly notifications = new Map<string, NotificationEntity[]>();

  constructor(
    private readonly fcmService: FcmService,
    private readonly deviceTokenService: DeviceTokenService,
    private readonly eventBus: EventBusService,
  ) {}

  async send(dto: SendNotificationDto): Promise<Notification> {
    const notification = new NotificationEntity();
    notification.id = `notif-${Date.now()}`;
    notification.userId = dto.userId;
    notification.type = dto.type;
    notification.title = dto.title;
    notification.body = dto.body;
    notification.read = false;
    notification.actionUrl = dto.actionUrl;
    notification.createdAt = new Date();
    notification.updatedAt = new Date();

    const userNotifications = this.notifications.get(dto.userId) ?? [];
    this.notifications.set(dto.userId, [notification, ...userNotifications]);

    const tokens = this.deviceTokenService.getActiveTokens(dto.userId);
    if (tokens.length) {
      await this.fcmService.sendToDevices(tokens, {
        title: dto.title,
        body: dto.body,
        data: { type: dto.type, notificationId: notification.id },
      });
    }

    this.eventBus.publish({
      type: 'notification.sent',
      payload: { notificationId: notification.id, userId: dto.userId },
      timestamp: new Date(),
    });

    return this.toNotification(notification);
  }

  findByUser(userId: string): Notification[] {
    return (this.notifications.get(userId) ?? []).map((n) => this.toNotification(n));
  }

  markRead(userId: string, notificationId: string): Notification {
    const items = this.notifications.get(userId) ?? [];
    const notification = items.find((n) => n.id === notificationId);

    if (!notification) {
      throw new NotFoundException(`Notification ${notificationId} not found`);
    }

    notification.read = true;
    notification.updatedAt = new Date();
    return this.toNotification(notification);
  }

  private toNotification(entity: NotificationEntity): Notification {
    return {
      id: entity.id,
      userId: entity.userId,
      type: entity.type,
      title: entity.title,
      body: entity.body,
      read: entity.read,
      actionUrl: entity.actionUrl,
      metadata: entity.metadata,
      createdAt: entity.createdAt.toISOString(),
    };
  }
}
