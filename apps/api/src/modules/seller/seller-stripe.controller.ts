import { Body, Controller, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  connectOnboardSchema,
  settleOrderSchema,
} from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaymentsAccessService } from '../payments/services/payments-access.service';
import { PaymentsService } from '../payments/payments.service';

/**
 * Spec-aligned Stripe Connect onboarding and settlement routes.
 * Existing equivalents: POST /seller/earnings/connect/onboard, POST /seller/earnings/connect/status
 */
@RequireRole('SELLER')
@Controller('seller')
export class SellerStripeController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly access: PaymentsAccessService,
  ) {}

  @RequirePermissions(PERMISSIONS.RECEIVE_PAYMENT)
  @Post('onboard')
  onboard(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    this.access.assertSellerRole(user.role);
    const dto = connectOnboardSchema.parse(body);
    return this.paymentsService.onboardConnect(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.RECEIVE_PAYMENT)
  @Post('settle-order')
  settleOrder(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = settleOrderSchema.parse(body);
    return this.paymentsService.settleOrder(user.id, dto);
  }
}
