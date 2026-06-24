import { Controller, Get, Param, Query } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { ListingsService } from './listings.service';
import { CategoriesService } from './services/categories.service';

/** Public catalog — mutations live under /seller/listings */
@Controller('listings')
export class ListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  @Public()
  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.listingsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Public()
  @Get('categories')
  findCategories() {
    return this.categoriesService.findAll();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findById(id);
  }
}
