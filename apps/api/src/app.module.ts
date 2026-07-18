import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { CommonModule } from './common/common.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { AuthGuard } from './common/guards/auth.guard';
import { MaintenanceGuard } from './common/guards/maintenance.guard';
import { RolesPermissionsGuard } from './common/guards/roles-permissions.guard';
import { SessionActivityInterceptor } from './common/interceptors/session-activity.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './email/email.module';
import { EventsModule } from './events/events.module';
import { JobsModule } from './jobs/jobs.module';
import { LibsModule } from './libs/libs.module';
import { AdminInvitationsModule } from './modules/admin-invitations/admin-invitations.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { BuyerModule } from './modules/buyer/buyer.module';
import { DevUploadModule } from './modules/dev-upload/dev-upload.module';
import { ChatModule } from './modules/chat/chat.module';
import { HealthModule } from './modules/health/health.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { ListingsModule } from './modules/listings/listings.module';
import { MonetizationModule } from './modules/monetization/monetization.module';
import { PlatformModule } from './modules/platform/platform.module';
import { StatementsModule } from './modules/statements/statements.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ShareModule } from './modules/share/share.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { FraudModule } from './modules/fraud/fraud.module';
import { SearchModule } from './modules/search/search.module';
import { SellerModule } from './modules/seller/seller.module';
import { AiMarketingModule } from './modules/ai-marketing/ai-marketing.module';
import { SuperAdminModule } from './modules/super-admin/super-admin.module';
import { UsersModule } from './modules/users/users.module';
import { UtilsModule } from './utils/utils.module';

@Module({
  imports: [
    CommonModule,
    AppConfigModule,
    EmailModule,
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
    MonetizationModule,
    PlatformModule,
    StatementsModule,
    NotificationsModule,
    SearchModule,
    ModerationModule,
    AdminModule,
    AdminInvitationsModule,
    SuperAdminModule,
    SellerModule,
    AiMarketingModule,
    BuyerModule,
    DevUploadModule,
    ShareModule,
    DisputesModule,
    FraudModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: MaintenanceGuard },
    { provide: APP_GUARD, useClass: RolesPermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    { provide: APP_INTERCEPTOR, useClass: SessionActivityInterceptor },
  ],
})
export class AppModule {}
