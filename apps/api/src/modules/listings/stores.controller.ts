import { Controller, Get, Param, Query } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { StoresService } from './services/stores.service';

@Public()
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  /** Must stay above `:slug` so "featured" is not parsed as a store slug. */
  @Get('featured')
  getFeaturedStores(@Query('limit') limit?: string) {
    const parsed = limit ? parseInt(limit, 10) : 6;
    return this.storesService.findFeatured(
      Number.isFinite(parsed) ? parsed : 6,
    );
  }

  @Get(':slug')
  getStore(@Param('slug') slug: string) {
    return this.storesService.getBySlug(slug);
  }

  @Get(':slug/listings')
  getStoreListings(
    @Param('slug') slug: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedSort =
      sort === 'price_low_to_high' || sort === 'price_high_to_low' ? sort : 'newest';
    return this.storesService.getListings(
      slug,
      parsedSort,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 24,
    );
  }
}
