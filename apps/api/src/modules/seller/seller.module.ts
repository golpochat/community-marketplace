import { Module } from '@nestjs/common';

import { ChatModule } from '../chat/chat.module';
import { ListingsModule } from '../listings/listings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';
import { SearchModule } from '../search/search.module';
import { UsersModule } from '../users/users.module';
import { SellerChatController } from './seller-chat.controller';
import { SellerEarningsController } from './seller-earnings.controller';
import { SellerListingsController } from './seller-listings.controller';
import { SellerNotificationsController } from './seller-notifications.controller';
import { SellerProfileController } from './seller-profile.controller';
import { SellerSearchController } from './seller-search.controller';

@Module({
  imports: [ListingsModule, PaymentsModule, UsersModule, ChatModule, NotificationsModule, SearchModule],
  controllers: [
    SellerListingsController,
    SellerEarningsController,
    SellerNotificationsController,
    SellerSearchController,
    SellerProfileController,
    SellerChatController,
  ],
})
export class SellerModule {}
