import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { JobsModule } from '../../jobs/jobs.module';
import { LibsModule } from '../../libs/libs.module';
import { CategoryIndexListener } from './listeners/category-index.listener';
import { ChatThreadIndexListener } from './listeners/chat-thread-index.listener';
import { ListingIndexListener } from './listeners/listing-index.listener';
import { UserIndexListener } from './listeners/user-index.listener';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { MeilisearchService } from './services/meilisearch.service';
import { SearchAnalyticsService } from './services/search-analytics.service';
import { SearchAutocompleteService } from './services/search-autocomplete.service';
import { SearchGlobalService } from './services/search-global.service';
import { SearchIndexingService } from './services/search-indexing.service';
import { SearchSemanticService } from './services/search-semantic.service';

@Module({
  imports: [LibsModule, DatabaseModule, EventsModule, JobsModule],
  controllers: [SearchController],
  providers: [
    SearchService,
    MeilisearchService,
    SearchIndexingService,
    SearchSemanticService,
    SearchAutocompleteService,
    SearchGlobalService,
    SearchAnalyticsService,
    ListingIndexListener,
    UserIndexListener,
    CategoryIndexListener,
    ChatThreadIndexListener,
  ],
  exports: [SearchService, MeilisearchService, SearchIndexingService, SearchSemanticService],
})
export class SearchModule {}
