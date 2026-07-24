import { Body, Controller, Get, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  confirmPriorityMessageSchema,
  createPriorityMessageIntentSchema,
} from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PlatformPurchaseService } from './services/platform-purchase.service';

@RequireRole('BUYER', 'SELLER')
@Controller('buyer/monetization/priority-message')
export class PriorityMessageController {
  constructor(private readonly purchases: PlatformPurchaseService) {}

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get('config')
  getConfig() {
    return this.purchases.getPriorityMessageConfig();
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Post('intent')
  createIntent(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = createPriorityMessageIntentSchema.parse(body);
    return this.purchases.createPriorityMessageIntent(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Post('confirm')
  confirm(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = confirmPriorityMessageSchema.parse(body);
    return this.purchases.confirmPriorityMessage(user.id, dto);
  }
}
