import { Controller, Get, Param, Post } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequireRole } from '../../common/decorators/rbac.decorator';
import { ListingReserveService } from '../listings/services/listing-reserve.service';

@RequireRole('SELLER')
@Controller('seller/reserves')
export class SellerReservesController {
  constructor(private readonly reserves: ListingReserveService) {}

  @Get('pending')
  listPending(@CurrentUser() user: AuthenticatedUser) {
    return this.reserves.listPendingForSeller(user.id);
  }

  @Post(':id/approve')
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.reserves.approve(user.id, id);
  }

  @Post(':id/decline')
  decline(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.reserves.decline(user.id, id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.reserves.cancelBySeller(user.id, id);
  }
}
