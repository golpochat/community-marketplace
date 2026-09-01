import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { DisputesService } from './services/disputes.service';

@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @RequireRole('BUYER')
  @Post('create')
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.disputesService.create(user.id, body);
  }

  @RequireRole('BUYER', 'SELLER')
  @Post('upload-evidence')
  uploadEvidence(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.disputesService.uploadEvidence(user.id, user.role as 'BUYER' | 'SELLER', body);
  }

  @RequireRole('SELLER')
  @Post('respond')
  respond(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.disputesService.respond(user.id, body);
  }

  @RequireRole('BUYER', 'SELLER')
  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser, @Query() query: Record<string, string>) {
    return this.disputesService.listForUser(
      user.id,
      user.role as 'BUYER' | 'SELLER',
      query,
    );
  }

  @RequireRole('BUYER', 'SELLER')
  @Get(':id')
  getDetail(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.disputesService.getDetail(id, user.id, user.role);
  }
}

@RequireRole('ADMIN', 'SUPER_ADMIN')
@Controller('admin/disputes')
export class AdminDisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @RequirePermissions(PERMISSIONS.VIEW_DISPUTES)
  @Get()
  list(@Query() query: Record<string, string>) {
    return this.disputesService.listForAdmin(query);
  }

  @RequirePermissions(PERMISSIONS.VIEW_DISPUTES)
  @Get(':id')
  getDetail(@Param('id') id: string) {
    return this.disputesService.getAdminDetail(id);
  }

  @RequirePermissions(PERMISSIONS.RESOLVE_DISPUTES)
  @Post(':id/request-evidence')
  requestEvidence(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.disputesService.requestEvidence(user.id, id, body);
  }

  @RequirePermissions(PERMISSIONS.RESOLVE_DISPUTES)
  @Post(':id/under-review')
  markUnderReview(@Param('id') id: string) {
    return this.disputesService.markUnderReview(id);
  }

  @RequirePermissions(PERMISSIONS.RESOLVE_DISPUTES)
  @Post(':id/resolve')
  resolve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.disputesService.resolve(user.id, id, body);
  }
}
