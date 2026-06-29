import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import { createStoreSchema, updateStoreSchema } from '@community-marketplace/validation';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SellerStoresService } from './services/seller-stores.service';

@RequireRole('SELLER')
@Controller('seller/stores')
export class SellerStoresController {
  constructor(private readonly storesService: SellerStoresService) {}

  @RequirePermissions(PERMISSIONS.VIEW_LISTINGS)
  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.storesService.getOverview(user.id);
  }

  @RequirePermissions(PERMISSIONS.VIEW_LISTINGS)
  @Get('primary')
  getPrimary(@CurrentUser() user: AuthenticatedUser) {
    return this.storesService.getPrimaryForUser(user.id);
  }

  @RequirePermissions(PERMISSIONS.VIEW_LISTINGS)
  @Get(':storeId')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('storeId') storeId: string) {
    return this.storesService.getForUser(user.id, storeId);
  }

  @RequirePermissions(PERMISSIONS.CREATE_LISTING)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: unknown) {
    createStoreSchema.parse(body);
    return this.storesService.create(user.id, body);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Patch(':storeId')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storeId') storeId: string,
    @Body() body: unknown,
  ) {
    updateStoreSchema.parse(body);
    return this.storesService.update(user.id, storeId, body);
  }
}
