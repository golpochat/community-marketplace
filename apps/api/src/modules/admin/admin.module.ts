import { Module } from '@nestjs/common';

import { ListingsModule } from '../listings/listings.module';
import { ModerationModule } from '../moderation/moderation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SearchModule } from '../search/search.module';
import { UsersModule } from '../users/users.module';
import { AdminModerationController } from './admin-moderation.controller';
import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminSearchController } from './admin-search.controller';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminRbacController } from './rbac/admin-rbac.controller';
import { RbacManagementService } from './rbac/rbac-management.service';
import { RbacScopePolicy } from './rbac/rbac-scope.policy';

@Module({
  imports: [
    UsersModule,
    ListingsModule,
    ModerationModule,
    SearchModule,
    NotificationsModule,
  ],
  controllers: [
    AdminController,
    AdminModerationController,
    AdminSearchController,
    AdminNotificationsController,
    AdminRbacController,
  ],
  providers: [AdminService, RbacManagementService, RbacScopePolicy],
  exports: [AdminService, RbacManagementService],
})
export class AdminModule {}
