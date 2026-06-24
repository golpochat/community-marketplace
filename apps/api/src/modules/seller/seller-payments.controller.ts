import { Body, Controller, Get, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { ConnectAccountDto } from '../payments/dto/payments.dto';
import { PaymentsService } from '../payments/payments.service';
import { StripeConnectService } from '../payments/services/stripe-connect.service';

@RequireRole('SELLER')
@Controller('seller/payments')
export class SellerPaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeConnectService: StripeConnectService,
  ) {}

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.findByUser(user.id);
  }

  @RequirePermissions(PERMISSIONS.RECEIVE_PAYMENT)
  @Post('connect/onboard')
  onboardConnect(@CurrentUser() user: AuthenticatedUser, @Body() dto: ConnectAccountDto) {
    return this.stripeConnectService.createConnectAccount(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.RECEIVE_PAYMENT)
  @Get('connect/account')
  getConnectAccount(@CurrentUser() user: AuthenticatedUser) {
    return this.stripeConnectService.getAccount(user.id) ?? null;
  }
}
