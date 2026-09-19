import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import { createAdminInvitationSchema } from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AdminInvitationsService } from './admin-invitations.service';

@RequireRole('SUPER_ADMIN')
@Controller('super-admin/invitations')
export class SuperAdminInvitationsController {
  constructor(private readonly invitations: AdminInvitationsService) {}

  @RequirePermissions(PERMISSIONS.MANAGE_ADMINS)
  @Get('inviteable-roles')
  listInviteableRoles() {
    return this.invitations.listInviteableRoles();
  }

  @RequirePermissions(PERMISSIONS.MANAGE_ADMINS)
  @Get()
  listInvitations() {
    return this.invitations.listPendingInvitations();
  }

  @RequirePermissions(PERMISSIONS.MANAGE_ADMINS)
  @Post()
  createInvitation(@CurrentUser() actor: AuthenticatedUser, @Body() body: unknown) {
    return this.invitations.createInvitation(actor, createAdminInvitationSchema.parse(body));
  }

  @RequirePermissions(PERMISSIONS.MANAGE_ADMINS)
  @Post(':id/resend')
  resendInvitation(@CurrentUser() actor: AuthenticatedUser, @Param('id') id: string) {
    return this.invitations.resendInvitation(actor, id);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_ADMINS)
  @Delete(':id')
  revokeInvitation(@Param('id') id: string) {
    return this.invitations.revokeInvitation(id);
  }
}
