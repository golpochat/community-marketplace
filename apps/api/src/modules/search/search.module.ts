import { Module } from '@nestjs/common';

import { LibsModule } from '../../libs/libs.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { MeilisearchService } from './services/meilisearch.service';

@Module({
  imports: [LibsModule],
  controllers: [SearchController],
  providers: [SearchService, MeilisearchService],
  exports: [SearchService, MeilisearchService],
})
export class SearchModule {}
