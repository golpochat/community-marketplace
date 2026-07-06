import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AdminModule } from '../admin/admin.module';
import { ModerationModule } from '../moderation/moderation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SearchModule } from '../search/search.module';
import { UsersModule } from '../users/users.module';
import { SuperAdminModerationController } from './super-admin-moderation.controller';
import { SuperAdminNotificationsController } from './super-admin-notifications.controller';
import { SuperAdminOperationsController } from './super-admin-operations.controller';
import { SuperAdminSearchController } from './super-admin-search.controller';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';

@Module({
  imports: [
    DatabaseModule,
    AdminModule,
    UsersModule,
    NotificationsModule,
    SearchModule,
    ModerationModule,
  ],
  controllers: [
    SuperAdminController,
    SuperAdminOperationsController,
    SuperAdminModerationController,
    SuperAdminNotificationsController,
    SuperAdminSearchController,
  ],
  providers: [SuperAdminService],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
