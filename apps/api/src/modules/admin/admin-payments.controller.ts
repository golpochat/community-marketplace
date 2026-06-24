import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  approveRefundSchema,
  disputeEvidenceSchema,
  manualPayoutSchema,
  paymentAdminFiltersSchema,
} from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaymentsService } from '../payments/payments.service';

@RequireRole('ADMIN', 'SUPER_ADMIN')
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get()
  listPayments(@Query() query: Record<string, string>) {
    const filters = paymentAdminFiltersSchema.parse({
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? parseInt(query.limit, 10) : 20,
      status: query.status,
      buyerId: query.buyerId,
      sellerId: query.sellerId,
      listingId: query.listingId,
    });
    return this.paymentsService.adminList(filters);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get('ledger')
  listLedger(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.paymentsService.listLedger(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get('refunds/pending')
  listPendingRefunds(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.paymentsService.listPendingRefunds(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @RequirePermissions(PERMISSIONS.REFUND_PAYMENT)
  @Post('refunds/approve')
  approveRefund(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = approveRefundSchema.parse(body);
    return this.paymentsService.approveRefund(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get('disputes')
  listDisputes(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.paymentsService.listDisputes(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get('disputes/:id')
  getDispute(@Param('id') id: string) {
    return this.paymentsService.getDispute(id);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Post('disputes/evidence')
  addDisputeEvidence(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = disputeEvidenceSchema.parse(body);
    return this.paymentsService.addDisputeEvidence(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Post('payouts/manual')
  triggerPayout(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = manualPayoutSchema.parse(body);
    return this.paymentsService.triggerManualPayout(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get('connect/:userId')
  getConnectStatus(@Param('userId') userId: string) {
    return this.paymentsService.getConnectAccountForAdmin(userId);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_PAYMENTS)
  @Get(':id')
  getPayment(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }
}
