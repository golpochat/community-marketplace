import { Module } from '@nestjs/common';

import { ChatModule } from '../chat/chat.module';
import { ListingsModule } from '../listings/listings.module';
import { ModerationModule } from '../moderation/moderation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { SearchModule } from '../search/search.module';
import { UsersModule } from '../users/users.module';
import { BuyerChatController } from './buyer-chat.controller';
import {
  BuyerFavoritesController,
  BuyerListingReportsController,
} from './buyer-favorites.controller';
import { BuyerNotificationsController } from './buyer-notifications.controller';
import { BuyerCheckoutController } from './buyer-checkout.controller';
import { OrderPaymentsController } from './order-payments.controller';
import { BuyerPaymentsController } from './buyer-payments.controller';
import { BuyerProfileController } from './buyer-profile.controller';
import { BuyerReviewsController } from './buyer-reviews.controller';
import { BuyerSearchController } from './buyer-search.controller';
import { BuyerReviewsService } from './buyer-reviews.service';
import { BuyerTrustController } from './buyer-trust.controller';
import { BuyerTrustService } from './buyer-trust.service';
import { BuyerReservesController } from './buyer-reserves.controller';

@Module({
  imports: [PaymentsModule, UsersModule, ListingsModule, ChatModule, NotificationsModule, SearchModule, ModerationModule],
  controllers: [
    BuyerPaymentsController,
    BuyerCheckoutController,
    OrderPaymentsController,
    BuyerNotificationsController,
    BuyerSearchController,
    BuyerReviewsController,
    BuyerTrustController,
    BuyerProfileController,
    BuyerFavoritesController,
    BuyerListingReportsController,
    BuyerChatController,
    BuyerReservesController,
  ],
  providers: [BuyerReviewsService, BuyerTrustService],
})
export class BuyerModule {}
