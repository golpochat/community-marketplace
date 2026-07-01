import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PlatformPurchaseReceiptService } from './services/platform-purchase-receipt.service';
import { PlatformPurchaseService } from './services/platform-purchase.service';

@RequireRole('SELLER')
@Controller('seller/earnings')
export class SellerMonetizationPurchasesController {
  constructor(
    private readonly purchases: PlatformPurchaseService,
    private readonly invoices: PlatformPurchaseReceiptService,
  ) {}

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get('purchases')
  listPurchases(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.purchases.listSellerPurchases(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get('purchases/:purchaseId/invoice')
  async downloadInvoice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('purchaseId') purchaseId: string,
    @Res() res: Response,
  ) {
    const file = await this.invoices.getInvoiceFile(purchaseId, user.id);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    res.send(file.buffer);
  }
}
