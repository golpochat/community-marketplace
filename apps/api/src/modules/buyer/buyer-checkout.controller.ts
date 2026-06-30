import { Body, Controller, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import { createCheckoutSessionSchema } from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaymentsAccessService } from '../payments/services/payments-access.service';
import { PaymentsService } from '../payments/payments.service';

/**
 * Spec-aligned Stripe Checkout route.
 * Existing equivalent: POST /buyer/payments/intent (PaymentIntents + Elements)
 */
@RequireRole('BUYER')
@Controller('checkout')
export class BuyerCheckoutController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly access: PaymentsAccessService,
  ) {}

  @RequirePermissions(PERMISSIONS.PURCHASE_ITEM)
  @Post('create-session')
  createSession(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    this.access.assertBuyerRole(user.role);
    const dto = createCheckoutSessionSchema.parse(body);
    return this.paymentsService.createCheckoutSession(user.id, dto);
  }
}
