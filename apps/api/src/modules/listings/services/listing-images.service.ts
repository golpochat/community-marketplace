import { Injectable, NotFoundException } from '@nestjs/common';

import { ListingImageEntity } from '../entities/listing-image.entity';
import type { UploadListingImageDto } from '../dto/listings.dto';

@Injectable()
export class ListingImagesService {
  private readonly images = new Map<string, ListingImageEntity[]>();

  findByListingId(listingId: string): ListingImageEntity[] {
    return this.images.get(listingId) ?? [];
  }

  add(listingId: string, dto: UploadListingImageDto): ListingImageEntity {
    const image = new ListingImageEntity();
    image.id = `img-${Date.now()}`;
    image.listingId = listingId;
    image.url = dto.url;
    image.altText = dto.altText;
    image.sortOrder = (this.images.get(listingId)?.length ?? 0) + 1;
    image.isPrimary = dto.isPrimary ?? false;
    image.createdAt = new Date();
    image.updatedAt = new Date();

    const existing = this.images.get(listingId) ?? [];

    if (image.isPrimary) {
      existing.forEach((item) => {
        item.isPrimary = false;
      });
    }

    this.images.set(listingId, [...existing, image]);
    return image;
  }

  remove(listingId: string, imageId: string): void {
    const existing = this.images.get(listingId) ?? [];
    const filtered = existing.filter((img) => img.id !== imageId);

    if (filtered.length === existing.length) {
      throw new NotFoundException(`Image ${imageId} not found`);
    }

    this.images.set(listingId, filtered);
  }
}
