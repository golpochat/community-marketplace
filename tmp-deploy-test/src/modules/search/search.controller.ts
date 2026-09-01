import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import {
  autocompleteQuerySchema,
  globalSearchQuerySchema,
  searchClickSchema,
} from '@community-marketplace/validation';

import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get('autocomplete')
  autocomplete(@Query() query: Record<string, string>) {
    const dto = autocompleteQuerySchema.parse(query);
    return this.searchService.suggest(dto);
  }

  @Public()
  @Get('global')
  globalSearch(@Query() query: Record<string, string>, @CurrentUser() user?: AuthenticatedUser) {
    const dto = globalSearchQuerySchema.parse(query);
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
    return this.searchService.globalSearch(dto, isAdmin);
  }

  @Public()
  @Post('click')
  trackClick(@Body() body: unknown, @CurrentUser() user?: AuthenticatedUser) {
    const dto = searchClickSchema.parse(body);
    return this.searchService.trackClick(dto.query, dto.entity, dto.clickedId, user?.id);
  }
}
