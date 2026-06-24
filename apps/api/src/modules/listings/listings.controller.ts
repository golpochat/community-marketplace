import { Controller, Get, Param, Query } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { ListingsService } from './listings.service';

/** Public catalog — mutations live under /seller/listings */
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Public()
  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.listingsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Public()
  @Get('search')
  search(@Query() query: Record<string, string>) {
    return this.listingsService.searchListings(query);
  }

  @Public()
  @Get('feeds')
  feeds(@Query() query: Record<string, string>) {
    return this.listingsService.getFeed(query);
  }

  @Public()
  @Get('categories')
  findCategories() {
    return this.listingsService.findCategories();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingsService.findById(id, true);
  }

  @Public()
  @Get(':id/images')
  getImages(@Param('id') id: string) {
    return this.listingsService.getImages(id);
  }
}
