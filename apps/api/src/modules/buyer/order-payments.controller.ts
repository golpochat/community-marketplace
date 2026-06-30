import { Body, Controller, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import { requestRefundSchema } from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaymentsService } from '../payments/payments.service';

/**
 * Spec-aligned refund route.
 * Existing equivalent: POST /buyer/payments/refunds
 */
@RequireRole('BUYER')
@Controller('order')
export class OrderPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Post('refund')
  refund(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = requestRefundSchema.parse(body);
    return this.paymentsService.requestRefund(user.id, dto);
  }
}
