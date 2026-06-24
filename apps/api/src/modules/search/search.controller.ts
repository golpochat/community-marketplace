import { Controller, Get, Query } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import { SearchQueryDto } from './dto/search.dto';
import { SearchService } from './search.service';

/** Public search — index management lives under /admin/search */
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get()
  search(@Query() dto: SearchQueryDto) {
    return this.searchService.search(dto);
  }
}
