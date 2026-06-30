import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import { connectOnboardSchema } from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaymentsAccessService } from '../payments/services/payments-access.service';
import { PaymentsService } from '../payments/payments.service';
import { MonetizationService } from '../monetization/monetization.service';

@RequireRole('SELLER')
@Controller('seller/earnings')
export class SellerEarningsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly access: PaymentsAccessService,
    private readonly monetization: MonetizationService,
  ) {}

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get('platform-fee')
  platformFee(@CurrentUser() user: AuthenticatedUser) {
    return this.monetization.getSellerFeeInfo(user.id);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get()
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.getEarningsSummary(user.id);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get('payouts')
  payouts(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.listPayouts(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get('payments')
  payments(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.findByUser(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @RequirePermissions(PERMISSIONS.RECEIVE_PAYMENT)
  @Post('connect/onboard')
  onboardConnect(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    this.access.assertSellerRole(user.role);
    const dto = connectOnboardSchema.parse(body);
    return this.paymentsService.onboardConnect(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.RECEIVE_PAYMENT)
  @Get('connect/status')
  connectStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.getConnectAccount(user.id);
  }

  @RequirePermissions(PERMISSIONS.RECEIVE_PAYMENT)
  @Post('connect/dashboard')
  connectDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.createConnectDashboardLink(user.id);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get('transfers/pending')
  pendingTransfers(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.listPendingSettlements(user.id);
  }
}
