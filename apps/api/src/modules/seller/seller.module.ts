import { Module } from '@nestjs/common';

import { ChatModule } from '../chat/chat.module';
import { ListingsModule } from '../listings/listings.module';
import { ModerationModule } from '../moderation/moderation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MonetizationModule } from '../monetization/monetization.module';
import { StatementsModule } from '../statements/statements.module';
import { PaymentsModule } from '../payments/payments.module';
import { SearchModule } from '../search/search.module';
import { UsersModule } from '../users/users.module';
import { ShareModule } from '../share/share.module';
import { SellerChatController } from './seller-chat.controller';
import { SellerEarningsController } from './seller-earnings.controller';
import { SellerStripeController } from './seller-stripe.controller';
import { SellerListingsController } from './seller-listings.controller';
import { SellerNotificationsController } from './seller-notifications.controller';
import { SellerProfileController } from './seller-profile.controller';
import { SellerReportsController } from './seller-reports.controller';
import { SellerShareAnalyticsController } from './seller-share-analytics.controller';
import { SellerSearchController } from './seller-search.controller';
import { SellerBuyerReviewsController } from './seller-buyer-reviews.controller';
import { SellerBuyerReviewsService } from './seller-buyer-reviews.service';
import { SellerStatusHistoryController } from './seller-status-history.controller';
import { SellerVerificationController } from './seller-verification.controller';
import { SellerStoresController } from './seller-stores.controller';
import { SellerStoresService } from './services/seller-stores.service';
import { SellerCapabilityService } from './services/seller-capability.service';
import { SellerOnboardingService } from './services/seller-onboarding.service';
import { SellerOnboardingController } from './seller-onboarding.controller';
import { SellerVerificationModule } from './seller-verification.module';

@Module({
  imports: [
    SellerVerificationModule,
    ListingsModule,
    MonetizationModule,
    StatementsModule,
    PaymentsModule,
    UsersModule,
    ChatModule,
    NotificationsModule,
    SearchModule,
    ModerationModule,
    ShareModule,
  ],
  controllers: [
    SellerListingsController,
    SellerEarningsController,
    SellerStripeController,
    SellerNotificationsController,
    SellerSearchController,
    SellerProfileController,
    SellerChatController,
    SellerReportsController,
    SellerShareAnalyticsController,
    SellerBuyerReviewsController,
    SellerStatusHistoryController,
    SellerVerificationController,
    SellerStoresController,
    SellerOnboardingController,
  ],
  providers: [
    SellerBuyerReviewsService,
    SellerStoresService,
    SellerCapabilityService,
    SellerOnboardingService,
  ],
  exports: [SellerStoresService, SellerCapabilityService],
})
export class SellerModule {}
