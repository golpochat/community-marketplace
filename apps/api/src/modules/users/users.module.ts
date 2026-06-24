import { Module } from '@nestjs/common';

import { UtilsModule } from '../../utils/utils.module';
import { UsersProfileService } from './services/users-profile.service';
import { UsersVerificationService } from './services/users-verification.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [UtilsModule],
  controllers: [UsersController],
  providers: [UsersService, UsersProfileService, UsersVerificationService],
  exports: [UsersService, UsersProfileService, UsersVerificationService],
})
export class UsersModule {}
