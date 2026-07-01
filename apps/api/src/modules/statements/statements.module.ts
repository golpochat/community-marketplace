import { Module, forwardRef } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { DevUploadModule } from '../dev-upload/dev-upload.module';
import { MonetizationModule } from '../monetization/monetization.module';
import { PaymentsModule } from '../payments/payments.module';
import { UsersModule } from '../users/users.module';
import { BuyerStatementsController } from './buyer-statements.controller';
import { AdminFinanceController } from './admin-finance.controller';
import { AccountStatementService } from './services/account-statement.service';
import { BuyerStatementFulfillmentService } from './services/buyer-statement-fulfillment.service';
import { BuyerStatementPurchaseService } from './services/buyer-statement-purchase.service';
import { PlatformRevenueReportService } from './services/platform-revenue-report.service';

@Module({
  imports: [
    DatabaseModule,
    DevUploadModule,
    UsersModule,
    PaymentsModule,
    forwardRef(() => MonetizationModule),
  ],
  controllers: [BuyerStatementsController, AdminFinanceController],
  providers: [
    AccountStatementService,
    BuyerStatementPurchaseService,
    BuyerStatementFulfillmentService,
    PlatformRevenueReportService,
  ],
  exports: [
    AccountStatementService,
    BuyerStatementPurchaseService,
    BuyerStatementFulfillmentService,
    PlatformRevenueReportService,
  ],
})
export class StatementsModule {}
