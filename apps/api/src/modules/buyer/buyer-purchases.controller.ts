import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreatePaymentDto } from '../payments/dto/payments.dto';
import { PaymentsService } from '../payments/payments.service';

@RequireRole('BUYER')
@Controller('buyer/purchases')
export class BuyerPurchasesController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @RequirePermissions(PERMISSIONS.PURCHASE_ITEM)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(user.id, 'user-seller', dto);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.findByUser(user.id);
  }

  @RequirePermissions(PERMISSIONS.VIEW_PAYMENTS)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findById(id);
  }
}
