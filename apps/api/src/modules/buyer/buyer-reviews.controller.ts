import { Body, Controller, Get, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { BuyerReviewsService } from './buyer-reviews.service';
import { CreateReviewDto } from './dto/buyer.dto';

@RequireRole('BUYER')
@Controller('buyer/reviews')
export class BuyerReviewsController {
  constructor(private readonly reviewsService: BuyerReviewsService) {}

  @RequirePermissions(PERMISSIONS.LEAVE_REVIEW)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.VIEW_REVIEWS)
  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.reviewsService.findByUser(user.id);
  }
}
