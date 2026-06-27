import { Controller, Get, Post, Body } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import { confirmFastTrackSchema } from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PlatformPurchaseService } from './services/platform-purchase.service';

@RequireRole('SELLER')
@Controller('seller/monetization/fast-track')
export class SellerFastTrackController {
  constructor(private readonly purchases: PlatformPurchaseService) {}

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Get('status')
  getStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.purchases.getFastTrackStatus(user.id);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post('intent')
  createIntent(@CurrentUser() user: AuthenticatedUser) {
    return this.purchases.createFastTrackIntent(user.id);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post('confirm')
  confirm(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = confirmFastTrackSchema.parse(body);
    return this.purchases.confirmFastTrack(user.id, dto);
  }
}
