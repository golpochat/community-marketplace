import { Controller, Get, Post, Body, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  confirmBuyerStatementSchema,
  createBuyerStatementIntentSchema,
  statementPeriodQuerySchema,
} from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { AccountStatementService } from './services/account-statement.service';
import { BuyerStatementPurchaseService } from './services/buyer-statement-purchase.service';
import { sendStatementExport } from './lib/send-statement-export';

@RequireRole('BUYER')
@Controller('buyer/statements')
export class BuyerStatementsController {
  constructor(
    private readonly statements: AccountStatementService,
    private readonly purchases: BuyerStatementPurchaseService,
  ) {}

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get('status')
  getStatus(@CurrentUser() user: AuthenticatedUser, @Query() query: unknown) {
    const { year, month } = statementPeriodQuerySchema.parse(query);
    return this.statements.getBuyerStatementStatus(user.id, year, month);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Post('intent')
  createIntent(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = createBuyerStatementIntentSchema.parse(body);
    return this.purchases.createIntent(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Post('confirm')
  confirm(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = confirmBuyerStatementSchema.parse(body);
    return this.purchases.confirm(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get('download')
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: unknown,
    @Res() res: Response,
  ) {
    const { year, month } = statementPeriodQuerySchema.parse(query);
    const file = await this.statements.exportBuyerStatement(user.id, year, month, 'pdf');
    sendStatementExport(res, file);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get('download/csv')
  async downloadCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: unknown,
    @Res() res: Response,
  ) {
    const { year, month } = statementPeriodQuerySchema.parse(query);
    const file = await this.statements.exportBuyerStatement(user.id, year, month, 'csv');
    sendStatementExport(res, file);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get('download/xlsx')
  async downloadXlsx(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: unknown,
    @Res() res: Response,
  ) {
    const { year, month } = statementPeriodQuerySchema.parse(query);
    const file = await this.statements.exportBuyerStatement(user.id, year, month, 'xlsx');
    sendStatementExport(res, file);
  }
}
