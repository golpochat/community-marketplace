import { Module } from '@nestjs/common';

import { AdminModule } from '../admin/admin.module';
import { UsersModule } from '../users/users.module';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';

@Module({
  imports: [AdminModule, UsersModule],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
  exports: [SuperAdminService],
})
export class SuperAdminModule {}
