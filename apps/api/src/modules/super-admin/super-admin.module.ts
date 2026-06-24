import { Module } from '@nestjs/common';

import { AdminModule } from '../admin/admin.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SearchModule } from '../search/search.module';
import { UsersModule } from '../users/users.module';
import { SuperAdminNotificationsController } from './super-admin-notifications.controller';
import { SuperAdminOperationsController } from './super-admin-operations.controller';
import { SuperAdminSearchController } from './super-admin-search.controller';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';

@Module({
  imports: [AdminModule, UsersModule, NotificationsModule, SearchModule],
  controllers: [
    SuperAdminController,
    SuperAdminOperationsController,
    SuperAdminNotificationsController,
    SuperAdminSearchController,
  ],
  providers: [SuperAdminService],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
