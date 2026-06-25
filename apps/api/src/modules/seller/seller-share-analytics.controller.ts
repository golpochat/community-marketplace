import { Controller, Get } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ShareService } from '../share/share.service';

@RequireRole('SELLER')
@Controller('seller/analytics/shares')
export class SellerShareAnalyticsController {
  constructor(private readonly shareService: ShareService) {}

  @RequirePermissions(PERMISSIONS.VIEW_LISTINGS)
  @Get()
  getShareAnalytics(@CurrentUser() user: AuthenticatedUser) {
    return this.shareService.getSellerShareAnalytics(user.id);
  }
}
