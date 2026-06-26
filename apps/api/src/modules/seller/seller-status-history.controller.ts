import { Controller, Get, Query } from '@nestjs/common';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequireRole } from '../../common/decorators/rbac.decorator';
import { SellerStatusHistoryService } from './services/seller-status-history.service';

@RequireRole('SELLER')
@Controller('seller/status-history')
export class SellerStatusHistoryController {
  constructor(private readonly historyService: SellerStatusHistoryService) {}

  @Get()
  getMyHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.historyService.getHistory(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
