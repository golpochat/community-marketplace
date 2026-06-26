import { Module } from '@nestjs/common';

import { ChatModule } from '../chat/chat.module';
import { ListingsModule } from '../listings/listings.module';
import { ModerationModule } from '../moderation/moderation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { SearchModule } from '../search/search.module';
import { UsersModule } from '../users/users.module';
import { ShareModule } from '../share/share.module';
import { SellerChatController } from './seller-chat.controller';
import { SellerEarningsController } from './seller-earnings.controller';
import { SellerListingsController } from './seller-listings.controller';
import { SellerNotificationsController } from './seller-notifications.controller';
import { SellerProfileController } from './seller-profile.controller';
import { SellerReportsController } from './seller-reports.controller';
import { SellerShareAnalyticsController } from './seller-share-analytics.controller';
import { SellerSearchController } from './seller-search.controller';
import { SellerBuyerReviewsController } from './seller-buyer-reviews.controller';
import { SellerBuyerReviewsService } from './seller-buyer-reviews.service';

@Module({
  imports: [ListingsModule, PaymentsModule, UsersModule, ChatModule, NotificationsModule, SearchModule, ModerationModule, ShareModule],
  controllers: [
    SellerListingsController,
    SellerEarningsController,
    SellerNotificationsController,
    SellerSearchController,
    SellerProfileController,
    SellerChatController,
    SellerReportsController,
    SellerShareAnalyticsController,
    SellerBuyerReviewsController,
  ],
  providers: [SellerBuyerReviewsService],
})
export class SellerModule {}
