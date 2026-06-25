import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { LibsModule } from '../../libs/libs.module';
import { ChatModule } from '../chat/chat.module';
import { ListingsModule } from '../listings/listings.module';
import { ModerationModule } from '../moderation/moderation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { SearchModule } from '../search/search.module';
import { UsersModule } from '../users/users.module';
import { AdminChatController } from './admin-chat.controller';
import { AdminListingsController } from './admin-listings.controller';
import { AdminModerationController } from './admin-moderation.controller';
import { AdminNotificationsController } from './admin-notifications.controller';
import { AdminPaymentsController } from './admin-payments.controller';
import { AdminSearchController } from './admin-search.controller';
import { AdminController } from './admin.controller';
import { AdminDeliveryReviewsController } from './admin-delivery-reviews.controller';
import { AdminPriceReviewsController } from './admin-price-reviews.controller';
import { AdminService } from './admin.service';
import { AdminRbacController } from './rbac/admin-rbac.controller';
import { RbacManagementService } from './rbac/rbac-management.service';
import { RbacScopePolicy } from './rbac/rbac-scope.policy';

@Module({
  imports: [
    DatabaseModule,
    LibsModule,
    EventsModule,
    UsersModule,
    ListingsModule,
    ChatModule,
    PaymentsModule,
    ModerationModule,
    SearchModule,
    NotificationsModule,
  ],
  controllers: [
    AdminController,
    AdminListingsController,
    AdminChatController,
    AdminPaymentsController,
    AdminModerationController,
    AdminSearchController,
    AdminNotificationsController,
    AdminRbacController,
    AdminDeliveryReviewsController,
    AdminPriceReviewsController,
  ],
  providers: [AdminService, RbacManagementService, RbacScopePolicy],
  exports: [AdminService, RbacManagementService],
})
export class AdminModule {}
