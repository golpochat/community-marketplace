import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { JobsModule } from '../../jobs/jobs.module';
import { LibsModule } from '../../libs/libs.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SearchModule } from '../search/search.module';
import { UsersModule } from '../users/users.module';
import { UtilsModule } from '../../utils/utils.module';
import { CategoriesService } from './services/categories.service';
import { DeliveryOptionsService } from './services/delivery-options.service';
import { ListingDeliveryService } from './services/listing-delivery.service';
import { ListingPricingService } from './services/listing-pricing.service';
import { ListingAnalyticsService } from './services/listing-analytics.service';
import { ListingAuditService } from './services/listing-audit.service';
import { ListingFavoritesService } from './services/listing-favorites.service';
import { ListingFeedsService } from './services/listing-feeds.service';
import { ListingImagesService } from './services/listing-images.service';
import { ListingLifecycleService } from './services/listing-lifecycle.service';
import { ListingExpiryJobService } from './services/listing-expiry.job';
import { ListingR2StorageService } from './services/listing-r2-storage.service';
import { ListingReviewService } from './services/listing-review.service';
import { ListingReportsService } from './services/listing-reports.service';
import { ListingSearchService } from './services/listing-search.service';
import { ListingVisibilityService } from './services/listing-visibility.service';
import { ListingsCrudService } from './services/listings-crud.service';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ListingOgCacheListener } from './listeners/listing-og-cache.listener';

@Module({
  imports: [DatabaseModule, UtilsModule, EventsModule, LibsModule, JobsModule, SearchModule, UsersModule, NotificationsModule],
  controllers: [ListingsController],
  providers: [
    ListingsService,
    ListingsCrudService,
    CategoriesService,
    ListingImagesService,
    ListingR2StorageService,
    ListingAuditService,
    ListingLifecycleService,
    ListingExpiryJobService,
    ListingSearchService,
    ListingFeedsService,
    ListingFavoritesService,
    ListingReportsService,
    ListingReviewService,
    ListingAnalyticsService,
    ListingVisibilityService,
    DeliveryOptionsService,
    ListingDeliveryService,
    ListingPricingService,
    ListingOgCacheListener,
  ],
  exports: [
    ListingsService,
    ListingLifecycleService,
    CategoriesService,
    DeliveryOptionsService,
    ListingDeliveryService,
    ListingPricingService,
  ],
})
export class ListingsModule {}
