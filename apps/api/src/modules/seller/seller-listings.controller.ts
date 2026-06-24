import {
  Body,
  Controller,
  Delete,
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

@RequireRole('SELLER')
@Controller('seller/listings')
export class SellerListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @RequirePermissions(PERMISSIONS.VIEW_LISTINGS)
  @Get()
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listingsService.findBySeller(user.id, {
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @RequirePermissions(PERMISSIONS.VIEW_LISTINGS)
  @Get('sold')
  findSold(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listingsService.findBySeller(user.id, {
      status: 'sold',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @RequirePermissions(PERMISSIONS.VIEW_LISTINGS)
  @Get('archived')
  findArchived(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listingsService.findBySeller(user.id, {
      status: 'archived',
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @RequirePermissions(PERMISSIONS.VIEW_LISTINGS)
  @Get('analytics/summary')
  analyticsSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.listingsService.getSellerAnalyticsSummary(user.id);
  }

  @RequirePermissions(PERMISSIONS.VIEW_LISTINGS)
  @Get(':id/analytics')
  listingAnalytics(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.listingsService.getAnalytics(id, user.id);
  }

  @RequirePermissions(PERMISSIONS.CREATE_LISTING)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.listingsService.create(user.id, body);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.listingsService.update(id, user.id, user.role, body);
  }

  @RequirePermissions(PERMISSIONS.DELETE_LISTING)
  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.listingsService.remove(id, user.id, user.role).then(() => ({
      deleted: true,
    }));
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post(':id/sold')
  markSold(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.listingsService.markSold(id, user.id, user.role);
  }

  @RequirePermissions(PERMISSIONS.ARCHIVE_LISTING)
  @Post(':id/archive')
  archive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.listingsService.archive(id, user.id, user.role);
  }

  @RequirePermissions(PERMISSIONS.ARCHIVE_LISTING)
  @Post(':id/unarchive')
  unarchive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.listingsService.unarchive(id, user.id, user.role);
  }

  @RequirePermissions(PERMISSIONS.VIEW_LISTINGS)
  @Get(':id/images')
  getImages(@Param('id') id: string) {
    return this.listingsService.getImages(id);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post(':id/images/upload-url')
  createUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.listingsService.createImageUploadUrl(id, user.id, body);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post(':id/images/confirm')
  confirmImages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.listingsService.confirmImages(id, user.id, body);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Patch(':id/images/order')
  reorderImages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.listingsService.reorderImages(id, user.id, body);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Delete(':id/images/:imageId')
  removeImage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('imageId') imageId: string,
  ) {
    return this.listingsService
      .removeImage(id, imageId, user.id, user.role)
      .then(() => ({ deleted: true }));
  }
}
