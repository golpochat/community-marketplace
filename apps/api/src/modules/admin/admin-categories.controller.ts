import { Body, Controller, Get, Param, Patch } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { ListingsService } from '../listings/listings.service';

@RequireRole('ADMIN', 'SUPER_ADMIN')
@Controller('admin/categories')
export class AdminCategoriesController {
  constructor(private readonly listingsService: ListingsService) {}

  @RequirePermissions(PERMISSIONS.MANAGE_LISTINGS)
  @Get()
  list() {
    return this.listingsService.findCategoriesForAdmin();
  }

  @RequirePermissions(PERMISSIONS.MANAGE_LISTINGS)
  @Patch(':id')
  updateFlags(@Param('id') id: string, @Body() body: unknown) {
    return this.listingsService.updateCategoryFlags(id, body);
  }
}
