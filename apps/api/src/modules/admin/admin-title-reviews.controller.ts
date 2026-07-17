import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import { titleReviewDecisionSchema } from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ListingsService } from '../listings/listings.service';

@RequireRole('SUPER_ADMIN', 'ADMIN')
@Controller('super-admin/title-reviews')
export class AdminTitleReviewsController {
  constructor(private readonly listingsService: ListingsService) {}

  @RequirePermissions(PERMISSIONS.MANAGE_LISTINGS)
  @Get()
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.listingsService.listPendingTitleReviews(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @RequirePermissions(PERMISSIONS.MANAGE_LISTINGS)
  @Post(':id/approve')
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const parsed = titleReviewDecisionSchema.parse(body ?? {});
    return this.listingsService.approveTitleChange(id, user.id, parsed.reviewNotes);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_LISTINGS)
  @Post(':id/reject')
  reject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    const parsed = titleReviewDecisionSchema.parse(body ?? {});
    return this.listingsService.rejectTitleChange(id, user.id, parsed.reviewNotes);
  }
}
