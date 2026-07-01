import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  confirmPaymentSchema,
  createPaymentIntentSchema,
  requestRefundSchema,
} from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaymentsAccessService } from '../payments/services/payments-access.service';
import { PaymentsService } from '../payments/payments.service';

@RequireRole('BUYER')
@Controller('buyer/payments')
export class BuyerPaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly access: PaymentsAccessService,
  ) {}

  @RequirePermissions(PERMISSIONS.PURCHASE_ITEM)
  @Post('intent')
  createIntent(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    this.access.assertBuyerRole(user.role);
    const dto = createPaymentIntentSchema.parse(body);
    return this.paymentsService.createPaymentIntent(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.PURCHASE_ITEM)
  @Post('confirm')
  confirm(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = confirmPaymentSchema.parse(body);
    return this.paymentsService.confirmPayment(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get()
  history(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.findBuyerHistory(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get(':id/receipt')
  async downloadReceipt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    await this.access.assertCanViewPayment(id, user.id, user.role);
    const file = await this.paymentsService.getBuyerReceiptFile(id, user.id);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.buffer);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get(':id')
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    await this.access.assertCanViewPayment(id, user.id, user.role);
    return this.paymentsService.findById(id);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Post('refunds')
  requestRefund(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = requestRefundSchema.parse(body);
    return this.paymentsService.requestRefund(user.id, dto);
  }
}
