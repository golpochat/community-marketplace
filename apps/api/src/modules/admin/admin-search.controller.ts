import { Body, Controller, Get, Param, Patch, Post, BadRequestException } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';
import {
  reindexSchema,
  searchRelevanceRulesSchema,
  searchStopWordsSchema,
  searchSynonymSchema,
} from '@community-marketplace/validation/search';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
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

  @RequirePermissions(PERMISSIONS.MANAGE_SEARCH_INDEX)
  @Get('health')
  health() {
    return this.searchService.health();
  }

  @RequirePermissions(PERMISSIONS.REINDEX_SEARCH)
  @Post('reindex')
  reindex(@Body() body: unknown) {
    const parsed = reindexSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    return this.searchService.reindex(parsed.data);
  }

  @RequirePermissions(PERMISSIONS.REINDEX_SEARCH)
  @Get('reindex/:type/status')
  reindexStatus(@Param('type') type: string) {
    return this.searchService.getReindexStatus(type as never);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_SEARCH_INDEX)
  @Get('analytics')
  analytics() {
    return this.searchService.getAnalytics();
  }

  @RequirePermissions(PERMISSIONS.MANAGE_SEARCH_INDEX)
  @Post('synonyms')
  updateSynonyms(@Body() body: unknown) {
    const dto = searchSynonymSchema.parse(body);
    return this.searchService.updateSynonyms('listings', [dto]);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_SEARCH_INDEX)
  @Post('stop-words')
  updateStopWords(@Body() body: unknown) {
    const dto = searchStopWordsSchema.parse(body);
    return this.searchService.updateStopWords('listings', dto.words);
  }

  @RequirePermissions(PERMISSIONS.MANAGE_SEARCH_INDEX)
  @Patch('relevance')
  updateRelevance(@Body() body: unknown) {
    const dto = searchRelevanceRulesSchema.parse(body);
    const tasks = [];
    if (dto.searchableAttributes) {
      for (const [index, attrs] of Object.entries(dto.searchableAttributes)) {
        tasks.push(
          this.searchService.updateRelevanceRules(index as never, {
            searchableAttributes: attrs,
            ...(dto.rankingRules ? { rankingRules: dto.rankingRules } : {}),
          }),
        );
      }
    }
    return Promise.all(tasks);
  }
}
