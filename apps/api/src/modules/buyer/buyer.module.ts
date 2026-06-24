import { Module } from '@nestjs/common';

import { ModerationModule } from '../moderation/moderation.module';
import { PaymentsModule } from '../payments/payments.module';
import { UsersModule } from '../users/users.module';
import { BuyerProfileController } from './buyer-profile.controller';
import { BuyerPurchasesController } from './buyer-purchases.controller';
import { BuyerReviewsController } from './buyer-reviews.controller';
import { BuyerReviewsService } from './buyer-reviews.service';

@Module({
  imports: [PaymentsModule, UsersModule, ModerationModule],
  controllers: [BuyerPurchasesController, BuyerReviewsController, BuyerProfileController],
  providers: [BuyerReviewsService],
})
export class BuyerModule {}
