import { Module } from '@nestjs/common';

import { LibsModule } from '../../libs/libs.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { DeviceTokenService, FcmService } from './services/fcm.service';

@Module({
  imports: [LibsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, FcmService, DeviceTokenService],
  exports: [NotificationsService, FcmService],
})
export class NotificationsModule {}
