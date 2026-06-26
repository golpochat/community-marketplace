import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { SellerVerificationService } from '../seller/services/seller-verification.service';
import { SellerStatusHistoryService } from '../seller/services/seller-status-history.service';

@RequireRole('ADMIN', 'SUPER_ADMIN')
@Controller('admin/seller-verification')
export class AdminSellerVerificationController {
  constructor(private readonly verificationService: SellerVerificationService) {}

  @RequirePermissions(PERMISSIONS.REVIEW_SELLER_VERIFICATION)
  @Get('requests')
  listRequests(@Query() query: Record<string, string>) {
    return this.verificationService.listAdmin(query);
  }

  @RequirePermissions(PERMISSIONS.REVIEW_SELLER_VERIFICATION)
  @Get('pending')
  listPending(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    return this.verificationService.listAdmin({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      view: 'pending',
      search,
      fromDate,
      toDate,
    });
  }

  @RequirePermissions(PERMISSIONS.VIEW_SELLER_DOCUMENTS)
  @Get('requests/:id')
  getRequest(@Param('id') id: string) {
    return this.verificationService.getRequestDetail(id);
  }

  @RequirePermissions(PERMISSIONS.VIEW_SELLER_DOCUMENTS)
  @Get('sellers/:userId')
  getSeller(@Param('userId') userId: string) {
    return this.verificationService.getSellerDetail(userId);
  }

  @RequirePermissions(PERMISSIONS.VIEW_SELLER_DOCUMENTS)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.verificationService.getRequestDetail(id);
  }

  @RequirePermissions(PERMISSIONS.REVIEW_SELLER_VERIFICATION)
  @Post('approve')
  approve(@CurrentUser() actor: AuthenticatedUser, @Body() body: unknown) {
    return this.verificationService.approve(actor.id, body);
  }

  @RequirePermissions(PERMISSIONS.REVIEW_SELLER_VERIFICATION)
  @Post('reject')
  reject(@CurrentUser() actor: AuthenticatedUser, @Body() body: unknown) {
    return this.verificationService.reject(actor.id, body);
  }
}

@RequireRole('ADMIN', 'SUPER_ADMIN')
@Controller('admin/seller')
export class AdminSellerManagementController {
  constructor(
    private readonly verificationService: SellerVerificationService,
    private readonly statusHistoryService: SellerStatusHistoryService,
  ) {}

  @RequirePermissions(PERMISSIONS.SUSPEND_SELLER)
  @Post('suspend')
  suspend(@CurrentUser() actor: AuthenticatedUser, @Body() body: unknown) {
    return this.verificationService.suspendSeller(actor.id, body);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_SELLER_LIMITS)
  @Post('limit')
  setLimit(@CurrentUser() actor: AuthenticatedUser, @Body() body: unknown) {
    return this.verificationService.setSellerLimit(actor.id, body);
  }

  @RequirePermissions(PERMISSIONS.REVIEW_SELLER_VERIFICATION)
  @Get('status-history/:userId')
  statusHistory(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.statusHistoryService.getHistory(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @RequirePermissions(PERMISSIONS.REACTIVATE_SELLER)
  @Post('reactivate')
  reactivate(@CurrentUser() actor: AuthenticatedUser, @Body() body: unknown) {
    return this.verificationService.reactivateSeller(actor.id, body);
  }

  @RequirePermissions(PERMISSIONS.FORCE_REVERIFY_SELLER)
  @Post('force-reverify')
  forceReverify(@CurrentUser() actor: AuthenticatedUser, @Body() body: unknown) {
    return this.verificationService.forceReverifySeller(actor.id, body);
  }

  @RequirePermissions(PERMISSIONS.FORCE_REVERIFY_SELLER)
  @Post('reverify')
  requestReverification(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() body: unknown,
  ) {
    return this.verificationService.forceReverifySeller(actor.id, body);
  }
}
