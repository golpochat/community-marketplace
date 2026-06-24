import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ListingsService } from '../listings/listings.service';
import { ModerationService } from '../moderation/moderation.service';

@RequireRole('BUYER', 'SELLER')
@Controller('buyer/favorites')
export class BuyerFavoritesController {
  constructor(private readonly listingsService: ListingsService) {}

  @RequirePermissions(PERMISSIONS.FAVORITE_LISTING)
  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listingsService.listFavorites(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @RequirePermissions(PERMISSIONS.FAVORITE_LISTING)
  @Post(':listingId')
  add(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId') listingId: string,
  ) {
    return this.listingsService.addFavorite(user.id, listingId);
  }

  @RequirePermissions(PERMISSIONS.FAVORITE_LISTING)
  @Delete(':listingId')
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId') listingId: string,
  ) {
    return this.listingsService.removeFavorite(user.id, listingId);
  }
}

@RequireRole('BUYER', 'SELLER')
@Controller('buyer/listings')
export class BuyerListingReportsController {
  constructor(private readonly moderationService: ModerationService) {}

  @RequirePermissions(PERMISSIONS.REPORT_LISTING)
  @Post(':listingId/report')
  report(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId') listingId: string,
    @Body() body: unknown,
  ) {
    return this.moderationService.reportListing(user.id, { ...(body as object), listingId });
  }
}
