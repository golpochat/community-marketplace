import { Body, Controller, Get, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { ReindexDto } from '../search/dto/search.dto';
import { SearchService } from '../search/search.service';

@RequireRole('ADMIN', 'SUPER_ADMIN')
@Controller('admin/search')
export class AdminSearchController {
  constructor(private readonly searchService: SearchService) {}

  @RequirePermissions(PERMISSIONS.MANAGE_SEARCH_INDEX)
  @Get('indexes')
  getIndexes() {
    return this.searchService.getIndexes();
  }

  @RequirePermissions(PERMISSIONS.REINDEX_SEARCH)
  @Post('reindex')
  reindex(@Body() dto: ReindexDto) {
    return this.searchService.reindex(dto);
  }
}
