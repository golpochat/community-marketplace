import { Body, Controller, Param, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ModerationService } from '../moderation/moderation.service';

@RequireRole('SELLER')
@Controller('seller/reports')
export class SellerReportsController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('users')
  reportUser(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.moderationService.reportUser(user.id, body);
  }

  @RequirePermissions(PERMISSIONS.REPORT_LISTING)
  @Post('listings/:listingId')
  reportListing(
    @CurrentUser() user: AuthenticatedUser,
    @Param('listingId') listingId: string,
    @Body() body: unknown,
  ) {
    return this.moderationService.reportListing(user.id, { ...(body as object), listingId });
  }

  @RequirePermissions(PERMISSIONS.FLAG_MESSAGE)
  @Post('messages')
  reportMessage(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.moderationService.reportMessage(user.id, body);
  }

  @Post('appeals')
  submitAppeal(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.moderationService.submitAppeal(user.id, body);
  }
}
