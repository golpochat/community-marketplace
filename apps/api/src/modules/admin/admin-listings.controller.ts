import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ListingsService } from '../listings/listings.service';

@RequireRole('ADMIN', 'SUPER_ADMIN')
@Controller('admin/listings')
export class AdminListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @RequirePermissions(PERMISSIONS.MANAGE_LISTINGS)
  @Get()
  list(
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('sellerId') sellerId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listingsService.adminList({
      status,
      categoryId,
      sellerId,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @RequirePermissions(PERMISSIONS.MANAGE_LISTINGS)
  @Get('reports')
  listReports(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.listingsService.listReports(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @RequirePermissions(PERMISSIONS.MANAGE_LISTINGS)
  @Get(':id/review')
  getReview(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.listingsService.getReviewContext(id, user.id, user.role);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_LISTINGS)
  @Post(':id/review/messages')
  addReviewMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.listingsService.addReviewMessage(id, user.id, user.role, body);
  }

  @RequirePermissions(PERMISSIONS.APPROVE_LISTING)
  @Post(':id/request-changes')
  requestChanges(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.listingsService.requestListingChanges(id, user.id, user.role, body);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_LISTINGS)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findById(id);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_LISTINGS)
  @Patch(':id')
  override(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.listingsService.adminOverride(id, user.id, body);
  }

  @RequirePermissions(PERMISSIONS.APPROVE_LISTING)
  @Post(':id/reject')
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.listingsService.rejectListing(id, user.id, body);
  }

  @RequirePermissions(PERMISSIONS.BAN_LISTING)
  @Post(':id/remove')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.listingsService.removeListing(id, user.id, body);
  }

  @RequirePermissions(PERMISSIONS.BAN_LISTING)
  @Post(':id/restore')
  restore(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.listingsService.restoreListing(id, user.id, body);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_LISTINGS)
  @Get(':id/status-history')
  statusHistory(@Param('id') id: string) {
    return this.listingsService.getStatusHistory(id);
  }

  @RequirePermissions(PERMISSIONS.BAN_LISTING)
  @Post(':id/ban')
  ban(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { moderationNotes?: string },
  ) {
    return this.listingsService.ban(id, user.id, body.moderationNotes);
  }

  @RequirePermissions(PERMISSIONS.BAN_LISTING)
  @Post(':id/unban')
  unban(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.listingsService.unban(id, user.id);
  }

  @RequirePermissions(PERMISSIONS.APPROVE_LISTING)
  @Post(':id/approve')
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.listingsService.approve(id, user.id);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_REPORTS)
  @Post('reports/:reportId/action')
  moderateReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param('reportId') reportId: string,
    @Body() body: unknown,
  ) {
    return this.listingsService.moderateReport(reportId, user.id, body);
  }
}
