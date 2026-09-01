import { Injectable } from '@nestjs/common';

import type {
  BroadcastNotificationInput,
  DispatchNotificationInput,
  Notification,
  NotificationPreferences,
} from '@community-marketplace/types';
import type {
  NotificationPreferencesUpdateInput,
  NotificationProviderInput,
  NotificationTemplateInput,
  TemplatePreviewInput,
} from '@community-marketplace/validation';

import { NotificationDeliveryService } from './services/notification-delivery.service';
import { NotificationDispatcherService } from './services/notification-dispatcher.service';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { NotificationProvidersService } from './services/notification-providers.service';
import { NotificationTemplatesService } from './services/notification-templates.service';
import { NotificationsCrudService } from './services/notifications-crud.service';
import type { SendNotificationDto } from './dto/notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly crud: NotificationsCrudService,
    private readonly dispatcher: NotificationDispatcherService,
    private readonly preferences: NotificationPreferencesService,
    private readonly templates: NotificationTemplatesService,
    private readonly providers: NotificationProvidersService,
    private readonly delivery: NotificationDeliveryService,
  ) {}

  async send(dto: SendNotificationDto): Promise<Notification> {
    const result = await this.dispatcher.dispatch({
      userId: dto.userId,
      type: dto.type,
      templateKey: 'admin_broadcast',
      variables: { title: dto.title, message: dto.body },
      actionUrl: dto.actionUrl,
      channels: ['in_app', 'push', 'email'],
    });

    const inApp = result.results?.in_app as { notification?: Notification } | undefined;
    if (inApp?.notification) return inApp.notification;

    return this.crud.createRecord({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      message: dto.body,
      channel: 'in_app',
      status: 'sent',
      actionUrl: dto.actionUrl,
    });
  }

  dispatch(input: DispatchNotificationInput) {
    return this.dispatcher.dispatch(input);
  }

  broadcast(input: BroadcastNotificationInput) {
    return this.dispatcher.broadcast(input);
  }

  findByUser(userId: string, page?: number, limit?: number, unreadOnly?: boolean) {
    return this.crud.listForUser(userId, page, limit, unreadOnly);
  }

  markRead(userId: string, notificationId: string) {
    return this.crud.markRead(userId, notificationId);
  }

  markAllRead(userId: string) {
    return this.crud.markAllRead(userId);
  }

  delete(userId: string, notificationId: string) {
    return this.crud.delete(userId, notificationId);
  }

  getUnreadCount(userId: string) {
    return this.crud.getUnreadCount(userId);
  }

  getPreferences(userId: string): Promise<NotificationPreferences> {
    return this.preferences.get(userId);
  }

  updatePreferences(userId: string, input: NotificationPreferencesUpdateInput) {
    return this.preferences.update(userId, input);
  }

  listTemplates(page?: number, limit?: number) {
    return this.templates.list(page, limit);
  }

  createTemplate(input: NotificationTemplateInput) {
    return this.templates.create(input);
  }

  previewTemplate(input: TemplatePreviewInput) {
    return this.templates.preview(input);
  }

  listProviders() {
    return this.providers.list();
  }

  createProvider(input: NotificationProviderInput) {
    return this.providers.create(input);
  }

  updateProvider(id: string, input: Partial<NotificationProviderInput>) {
    return this.providers.update(id, input);
  }

  providerHealth(id: string) {
    return this.providers.healthCheck(id);
  }

  listDeliveryLogs(page = 1, limit = 50) {
    return this.delivery.listLogs(page, limit);
  }
}
