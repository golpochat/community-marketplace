import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

import { PERMISSIONS } from '@community-marketplace/types';
import { connectOnboardSchema, statementPeriodQuerySchema } from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaymentsAccessService } from '../payments/services/payments-access.service';
import { PaymentsService } from '../payments/payments.service';
import { MonetizationService } from '../monetization/monetization.service';
import { AccountStatementService } from '../statements/services/account-statement.service';
import { sendStatementExport } from '../statements/lib/send-statement-export';

@RequireRole('SELLER')
@Controller('seller/earnings')
export class SellerEarningsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly access: PaymentsAccessService,
    private readonly monetization: MonetizationService,
    private readonly statements: AccountStatementService,
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
  @Get('statement')
  async downloadStatement(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: unknown,
    @Res() res: Response,
  ) {
    const { year, month } = statementPeriodQuerySchema.parse(query);
    const file = await this.statements.exportSellerStatement(user.id, year, month, 'pdf');
    sendStatementExport(res, file);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get('statement/csv')
  async downloadStatementCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: unknown,
    @Res() res: Response,
  ) {
    const { year, month } = statementPeriodQuerySchema.parse(query);
    const file = await this.statements.exportSellerStatement(user.id, year, month, 'csv');
    sendStatementExport(res, file);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get('statement/xlsx')
  async downloadStatementXlsx(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: unknown,
    @Res() res: Response,
  ) {
    const { year, month } = statementPeriodQuerySchema.parse(query);
    const file = await this.statements.exportSellerStatement(user.id, year, month, 'xlsx');
    sendStatementExport(res, file);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get('payments/:paymentId/receipt')
  async downloadPaymentReceipt(
    @CurrentUser() user: AuthenticatedUser,
    @Param('paymentId') paymentId: string,
    @Res() res: Response,
  ) {
    await this.access.assertCanViewPayment(paymentId, user.id, user.role);
    const file = await this.paymentsService.getSellerReceiptFile(paymentId, user.id);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.buffer);
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
