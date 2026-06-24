import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { LibsModule } from '../../libs/libs.module';
import { SearchModule } from '../search/search.module';
import { UtilsModule } from '../../utils/utils.module';
import { CategoriesService } from './services/categories.service';
import { ListingAnalyticsService } from './services/listing-analytics.service';
import { ListingAuditService } from './services/listing-audit.service';
import { ListingFavoritesService } from './services/listing-favorites.service';
import { ListingFeedsService } from './services/listing-feeds.service';
import { ListingImagesService } from './services/listing-images.service';
import { ListingLifecycleService } from './services/listing-lifecycle.service';
import { ListingR2StorageService } from './services/listing-r2-storage.service';
import { ListingReportsService } from './services/listing-reports.service';
import { ListingSearchService } from './services/listing-search.service';
import { ListingVisibilityService } from './services/listing-visibility.service';
import { ListingsCrudService } from './services/listings-crud.service';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [DatabaseModule, UtilsModule, EventsModule, LibsModule, SearchModule],
  controllers: [ListingsController],
  providers: [
    ListingsService,
    ListingsCrudService,
    CategoriesService,
    ListingImagesService,
    ListingR2StorageService,
    ListingAuditService,
    ListingLifecycleService,
    ListingSearchService,
    ListingFeedsService,
    ListingFavoritesService,
    ListingReportsService,
    ListingAnalyticsService,
    ListingVisibilityService,
  ],
  exports: [ListingsService, CategoriesService],
})
export class ListingsModule {}
