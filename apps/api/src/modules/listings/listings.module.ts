import { forwardRef, Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { EventsModule } from '../../events/events.module';
import { JobsModule } from '../../jobs/jobs.module';
import { LibsModule } from '../../libs/libs.module';
import { DevUploadModule } from '../dev-upload/dev-upload.module';
import { ChatModule } from '../chat/chat.module';
import { ModerationModule } from '../moderation/moderation.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SearchModule } from '../search/search.module';
import { SellerVerificationModule } from '../seller/seller-verification.module';
import { UsersModule } from '../users/users.module';
import { UtilsModule } from '../../utils/utils.module';
import { CategoriesService } from './services/categories.service';
import { DeliveryOptionsService } from './services/delivery-options.service';
import { ListingDeliveryService } from './services/listing-delivery.service';
import { ListingPricingService } from './services/listing-pricing.service';
import { ListingTitleService } from './services/listing-title.service';
import { ListingAnalyticsService } from './services/listing-analytics.service';
import { ListingAuditService } from './services/listing-audit.service';
import { ListingFavoritesService } from './services/listing-favorites.service';
import { ListingFeedsService } from './services/listing-feeds.service';
import { CommunityStatsService } from './services/community-stats.service';
import { ListingImagesService } from './services/listing-images.service';
import { ListingImageProcessorService } from './services/listing-image-processor.service';
import { ListingLifecycleService } from './services/listing-lifecycle.service';
import { ListingExpiryJobService } from './services/listing-expiry.job';
import { ListingReserveService } from './services/listing-reserve.service';
import { ListingReserveExpiryJobService } from './services/listing-reserve-expiry.job';
import { ListingR2StorageService } from './services/listing-r2-storage.service';
import { ListingReviewService } from './services/listing-review.service';
import { ListingReportsService } from './services/listing-reports.service';
import { ListingSearchService } from './services/listing-search.service';
import { ListingVisibilityService } from './services/listing-visibility.service';
import { SellerTrustService } from './services/seller-trust.service';
import { StoresService } from './services/stores.service';
import { GeocodingService } from './services/geocoding.service';
import { NearbyAreasService } from './services/nearby-areas.service';
import { ListingsCrudService } from './services/listings-crud.service';
import { ListingsController } from './listings.controller';
import { StoresController } from './stores.controller';
import { ListingsService } from './listings.service';
import { ListingAutoModerationService } from './services/listing-auto-moderation.service';
import { ListingKeywordFilterService } from './services/listing-keyword-filter.service';
import { ListingAutoModerationListener } from './listeners/listing-auto-moderation.listener';
import { ListingOgCacheListener } from './listeners/listing-og-cache.listener';

@Module({
  imports: [
    DatabaseModule,
    UtilsModule,
    EventsModule,
    LibsModule,
    JobsModule,
    SearchModule,
    UsersModule,
    NotificationsModule,
    DevUploadModule,
    forwardRef(() => ChatModule),
    forwardRef(() => SellerVerificationModule),
    ModerationModule,
  ],
  controllers: [ListingsController, StoresController],
  providers: [
    ListingsService,
    ListingsCrudService,
    CategoriesService,
    ListingImagesService,
    ListingImageProcessorService,
    ListingR2StorageService,
    ListingAuditService,
    ListingLifecycleService,
    ListingExpiryJobService,
    ListingReserveService,
    ListingReserveExpiryJobService,
    ListingSearchService,
    SellerTrustService,
    StoresService,
    GeocodingService,
    NearbyAreasService,
    ListingFeedsService,
    CommunityStatsService,
    ListingFavoritesService,
    ListingReportsService,
    ListingReviewService,
    ListingAnalyticsService,
    ListingVisibilityService,
    DeliveryOptionsService,
    ListingDeliveryService,
    ListingPricingService,
    ListingTitleService,
    ListingKeywordFilterService,
    ListingAutoModerationService,
    ListingAutoModerationListener,
    ListingOgCacheListener,
  ],
  exports: [
    ListingsService,
    ListingLifecycleService,
    ListingImagesService,
    ListingVisibilityService,
    ListingReserveService,
    CategoriesService,
    DeliveryOptionsService,
    ListingDeliveryService,
    ListingPricingService,
    ListingTitleService,
    SellerTrustService,
    ListingKeywordFilterService,
  ],
})
export class ListingsModule {}
