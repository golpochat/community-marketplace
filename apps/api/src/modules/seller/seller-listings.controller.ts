import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';

import { PERMISSIONS } from '@community-marketplace/types';

import { RequirePermissions, RequireRole } from '../../common/decorators/rbac.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import {
  CreateListingDto,
  UpdateListingDto,
  UploadListingImageDto,
} from '../listings/dto/listings.dto';
import { ListingImagesService } from '../listings/services/listing-images.service';
import { ListingsService } from '../listings/listings.service';

@RequireRole('SELLER')
@Controller('seller/listings')
export class SellerListingsController {
  constructor(
    private readonly listingsService: ListingsService,
    private readonly imagesService: ListingImagesService,
  ) {}

  @RequirePermissions(PERMISSIONS.VIEW_LISTINGS)
  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.listingsService.findAll(1, 100);
  }

  @RequirePermissions(PERMISSIONS.CREATE_LISTING)
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateListingDto) {
    return this.listingsService.create(user.id, dto);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateListingDto) {
    return this.listingsService.update(id, dto);
  }

  @RequirePermissions(PERMISSIONS.DELETE_LISTING)
  @Delete(':id')
  remove(@Param('id') id: string) {
    this.listingsService.remove(id);
    return { deleted: true };
  }

  @RequirePermissions(PERMISSIONS.VIEW_LISTINGS)
  @Get(':id/images')
  getImages(@Param('id') id: string) {
    return this.imagesService.findByListingId(id);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Post(':id/images')
  addImage(@Param('id') id: string, @Body() dto: UploadListingImageDto) {
    return this.imagesService.add(id, dto);
  }

  @RequirePermissions(PERMISSIONS.EDIT_LISTING)
  @Delete(':id/images/:imageId')
  removeImage(@Param('id') id: string, @Param('imageId') imageId: string) {
    this.imagesService.remove(id, imageId);
    return { deleted: true };
  }
}
