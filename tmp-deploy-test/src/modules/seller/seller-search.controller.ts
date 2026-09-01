import { Controller, Get, Query } from '@nestjs/common';

import { autocompleteQuerySchema, globalSearchQuerySchema, listingSearchQuerySchema } from '@community-marketplace/validation';

import { RequireRole } from '../../common/decorators/rbac.decorator';
import { ListingsService } from '../listings/listings.service';
import { SearchService } from '../search/search.service';

@RequireRole('SELLER')
@Controller('seller/search')
export class SellerSearchController {
  constructor(
    private readonly listings: ListingsService,
    private readonly search: SearchService,
  ) {}

  @Get('listings')
  searchListings(@Query() query: Record<string, string>) {
    listingSearchQuerySchema.parse({
      ...query,
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 20,
    });
    return this.listings.searchListings(query);
  }

  @Get('autocomplete')
  autocomplete(@Query() query: Record<string, string>) {
    return this.search.suggest(autocompleteQuerySchema.parse(query));
  }

  @Get('global')
  global(@Query() query: Record<string, string>) {
    const dto = globalSearchQuerySchema.parse(query);
    return this.search.globalSearch(dto, false);
  }
}
