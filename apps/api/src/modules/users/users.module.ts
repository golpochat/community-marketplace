import { Module } from '@nestjs/common';

import { UtilsModule } from '../../utils/utils.module';
import { AdminUsersController } from './admin-users.controller';
import { R2StorageService } from './services/r2-storage.service';
import { UserAuditService } from './services/user-audit.service';
import { UsersAdminService } from './services/users-admin.service';
import { UsersProfileService } from './services/users-profile.service';
import { UsersSettingsService } from './services/users-settings.service';
import { UsersVerificationService } from './services/users-verification.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [UtilsModule],
  controllers: [UsersController, AdminUsersController],
  providers: [
    UsersService,
    UsersProfileService,
    UsersSettingsService,
    UsersVerificationService,
    UsersAdminService,
    UserAuditService,
    R2StorageService,
  ],
  exports: [
    UsersService,
    UsersProfileService,
    UsersVerificationService,
    UsersAdminService,
    UserAuditService,
  ],
})
export class UsersModule {}
