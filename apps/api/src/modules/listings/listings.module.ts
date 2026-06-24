import { Module } from '@nestjs/common';

import { UtilsModule } from '../../utils/utils.module';
import { CategoriesService } from './services/categories.service';
import { ListingImagesService } from './services/listing-images.service';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [UtilsModule],
  controllers: [ListingsController],
  providers: [ListingsService, CategoriesService, ListingImagesService],
  exports: [ListingsService, CategoriesService, ListingImagesService],
})
export class ListingsModule {}
