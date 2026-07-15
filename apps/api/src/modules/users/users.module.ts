import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { UtilsModule } from '../../utils/utils.module';
import { AdminUsersController } from './admin-users.controller';
import { R2StorageService } from './services/r2-storage.service';
import { UserAuditService } from './services/user-audit.service';
import { UsersAdminService } from './services/users-admin.service';
import { UsersPhoneService } from './services/users-phone.service';
import { UsersProfileService } from './services/users-profile.service';
import { UsersSettingsService } from './services/users-settings.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [UtilsModule, AuthModule],
  controllers: [UsersController, AdminUsersController],
  providers: [
    UsersService,
    UsersProfileService,
    UsersPhoneService,
    UsersSettingsService,
    UsersAdminService,
    UserAuditService,
    R2StorageService,
  ],
  exports: [
    UsersService,
    UsersProfileService,
    UsersAdminService,
    UserAuditService,
    R2StorageService,
  ],
})
export class UsersModule {}
