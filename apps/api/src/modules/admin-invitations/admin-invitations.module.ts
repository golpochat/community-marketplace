import { Module } from '@nestjs/common';

import { LibsModule } from '../../libs/libs.module';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AdminInviteAuthController } from './admin-invite-auth.controller';
import { AdminInvitationEmailService } from './admin-invitation-email.service';
import { AdminInvitationsService } from './admin-invitations.service';
import { SuperAdminInvitationsController } from './super-admin-invitations.controller';

@Module({
  imports: [DatabaseModule, LibsModule, AuthModule],
  controllers: [SuperAdminInvitationsController, AdminInviteAuthController],
  providers: [AdminInvitationsService, AdminInvitationEmailService],
  exports: [AdminInvitationsService],
})
export class AdminInvitationsModule {}
