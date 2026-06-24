import { Module } from '@nestjs/common';

import { ListingsModule } from '../listings/listings.module';
import { PaymentsModule } from '../payments/payments.module';
import { UsersModule } from '../users/users.module';
import { SellerListingsController } from './seller-listings.controller';
import { SellerPaymentsController } from './seller-payments.controller';
import { SellerProfileController } from './seller-profile.controller';

@Module({
  imports: [ListingsModule, PaymentsModule, UsersModule],
  controllers: [SellerListingsController, SellerPaymentsController, SellerProfileController],
})
export class SellerModule {}
