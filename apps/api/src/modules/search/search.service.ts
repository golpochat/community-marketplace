import { Injectable } from '@nestjs/common';

import type { SearchQueryDto } from './dto/search.dto';
import { MeilisearchService } from './services/meilisearch.service';

@Injectable()
export class SearchService {
  constructor(private readonly meilisearchService: MeilisearchService) {}

  search(dto: SearchQueryDto) {
    const indexName = dto.type ?? 'listings';
    return this.meilisearchService.search(indexName, dto.q, {
      limit: dto.limit,
      offset: dto.offset,
    });
  }

  getIndexes() {
    return this.meilisearchService.getIndexes();
  }

  reindex(dto: import('./dto/search.dto').ReindexDto) {
    return this.meilisearchService.reindex(dto);
  }
}
