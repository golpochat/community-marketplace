import { Body, Controller, Get, Post } from '@nestjs/common';

import { createBuyerReviewSchema } from '@community-marketplace/validation';

import { RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SellerBuyerReviewsService } from './seller-buyer-reviews.service';

@RequireRole('SELLER')
@Controller('seller/reviews')
export class SellerBuyerReviewsController {
  constructor(private readonly reviewsService: SellerBuyerReviewsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    return this.reviewsService.create(user.id, createBuyerReviewSchema.parse(body));
  }

  @Get('pending')
  findPending(@CurrentUser() user: AuthenticatedUser) {
    return this.reviewsService.findPendingForSeller(user.id);
  }
}
