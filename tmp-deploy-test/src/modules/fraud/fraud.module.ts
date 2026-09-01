import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { ModerationModule } from '../moderation/moderation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SellerVerificationModule } from '../seller/seller-verification.module';
import { AdminFraudController } from './admin-fraud.controller';
import { FraudDetectionListener } from './listeners/fraud-detection.listener';
import { FraudDetectionService } from './services/fraud-detection.service';
import { FraudRiskService } from './services/fraud-risk.service';
import { FraudSignalsService } from './services/fraud-signals.service';

@Module({
  imports: [
    DatabaseModule,
    EventsModule,
    ModerationModule,
    NotificationsModule,
    SellerVerificationModule,
  ],
  controllers: [AdminFraudController],
  providers: [
    FraudSignalsService,
    FraudRiskService,
    FraudDetectionService,
    FraudDetectionListener,
  ],
  exports: [FraudDetectionService, FraudSignalsService],
})
export class FraudModule {}
