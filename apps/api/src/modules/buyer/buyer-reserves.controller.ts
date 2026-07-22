import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { createListingReserveSchema } from '@community-marketplace/validation';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequireRole } from '../../common/decorators/rbac.decorator';
import { ListingReserveService } from '../listings/services/listing-reserve.service';

@RequireRole('BUYER', 'SELLER')
@Controller('buyer/reserves')
export class BuyerReservesController {
  constructor(private readonly reserves: ListingReserveService) {}

  @Post()
  request(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    const dto = createListingReserveSchema.parse(body);
    return this.reserves.request(user.id, dto.listingId);
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.reserves.listMine(user.id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.reserves.cancelByBuyer(user.id, id);
  }
}
