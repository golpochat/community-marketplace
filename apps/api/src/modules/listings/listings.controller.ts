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
  @Get('community-stats')
  communityStats() {
    return this.listingsService.getCommunityStats();
  }

  @Public()
  @Get('feeds')
  feeds(@Query() query: Record<string, string>) {
    return this.listingsService.getFeed(query);
  }

  @Public()
  @Get('nearby-areas')
  nearbyAreas(@Query() query: Record<string, string>) {
    return this.listingsService.getNearbyAreas(query);
  }

  @Public()
  @Get('reverse-geocode')
  reverseGeocode(@Query() query: Record<string, string>) {
    return this.listingsService.reverseGeocode(query);
  }

  @Public()
  @Get('delivery-options')
  listDeliveryOptions() {
    return this.listingsService.listDeliveryOptions();
  }

  @Public()
  @Get('categories')
  findCategories() {
    return this.listingsService.findCategories();
  }

  @Public()
  @Get('sellers/:sellerId/trust')
  sellerTrust(@Param('sellerId') sellerId: string) {
    return this.listingsService.getSellerTrust(sellerId);
  }

  @Public()
  @Get(':id/similar')
  findSimilar(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.listingsService.findSimilar(
      id,
      limit ? parseInt(limit, 10) : 4,
    );
  }

  @Public()
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query('trackView') trackView?: string,
  ) {
    return this.listingsService.findById(id, trackView !== 'false');
  }

  @Public()
  @Get(':id/images')
  getImages(@Param('id') id: string) {
    return this.listingsService.getImages(id);
  }
}
