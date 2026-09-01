import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { AdminDisputesController, DisputesController } from './disputes.controller';
import { DisputeAccessService } from './services/dispute-access.service';
import { DisputesService } from './services/disputes.service';

@Module({
  imports: [DatabaseModule, UsersModule, NotificationsModule],
  controllers: [DisputesController, AdminDisputesController],
  providers: [DisputesService, DisputeAccessService],
  exports: [DisputesService],
})
export class DisputesModule {}
