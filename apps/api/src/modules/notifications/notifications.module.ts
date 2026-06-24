import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { LibsModule } from '../../libs/libs.module';
import { NotificationEventsListener } from './listeners/notification-events.listener';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { DeviceTokenService } from './services/device-token.service';
import {
  EmailChannelService,
  InAppChannelService,
  PushChannelService,
} from './services/notification-channels.service';
import { NotificationDeliveryService } from './services/notification-delivery.service';
import { NotificationDispatcherService } from './services/notification-dispatcher.service';
import { NotificationPreferencesService } from './services/notification-preferences.service';
import { NotificationProvidersService } from './services/notification-providers.service';
import { NotificationRateLimitService } from './services/notification-rate-limit.service';
import { NotificationTemplateEngineService } from './services/notification-template-engine.service';
import { NotificationTemplatesService } from './services/notification-templates.service';
import { NotificationsCrudService } from './services/notifications-crud.service';

@Module({
  imports: [DatabaseModule, EventsModule, LibsModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsCrudService,
    NotificationTemplateEngineService,
    NotificationTemplatesService,
    NotificationProvidersService,
    NotificationPreferencesService,
    NotificationRateLimitService,
    NotificationDeliveryService,
    NotificationDispatcherService,
    EmailChannelService,
    PushChannelService,
    InAppChannelService,
    DeviceTokenService,
    NotificationEventsListener,
  ],
  exports: [NotificationsService, NotificationDispatcherService, DeviceTokenService],
})
export class NotificationsModule {}
