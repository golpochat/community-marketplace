import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { CommonModule } from './common/common.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { AuthGuard } from './common/guards/auth.guard';
import { RolesPermissionsGuard } from './common/guards/roles-permissions.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { EventsModule } from './events/events.module';
import { JobsModule } from './jobs/jobs.module';
import { LibsModule } from './libs/libs.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { BuyerModule } from './modules/buyer/buyer.module';
import { DevUploadModule } from './modules/dev-upload/dev-upload.module';
import { ChatModule } from './modules/chat/chat.module';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { ListingsModule } from './modules/listings/listings.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ShareModule } from './modules/share/share.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { FraudModule } from './modules/fraud/fraud.module';
import { SearchModule } from './modules/search/search.module';
import { SellerModule } from './modules/seller/seller.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { UsersModule } from './modules/users/users.module';
import { UtilsModule } from './utils/utils.module';

@Module({
  imports: [
    CommonModule,
    AppConfigModule,
    DatabaseModule,
    LibsModule,
    UtilsModule,
    EventsModule,
    JobsModule,
    HealthModule,
    MetricsModule,
    AuthModule,
    UsersModule,
    ListingsModule,
    ChatModule,
    PaymentsModule,
    NotificationsModule,
    SearchModule,
    ModerationModule,
    AdminModule,
    SuperAdminModule,
    SellerModule,
    BuyerModule,
    DevUploadModule,
    ShareModule,
    DisputesModule,
    FraudModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesPermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
  ],
})
export class AppModule {}
