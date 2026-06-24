import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { ListingImage, RbacRole } from '@community-marketplace/types';
import {
  confirmListingImagesSchema,
  reorderListingImagesSchema,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { mapListingImage } from '../mappers/listing.mapper';
import { ListingAuditService } from './listing-audit.service';
import { ListingR2StorageService } from './listing-r2-storage.service';

@Injectable()
export class ListingImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ListingR2StorageService,
    private readonly audit: ListingAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async findByListingId(listingId: string): Promise<ListingImage[]> {
    const rows = await this.prisma.listingImage.findMany({
      where: { listingId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(mapListingImage);
  }

  async createUploadUrl(
    listingId: string,
    sellerId: string,
    input: unknown,
  ) {
    await this.assertSellerOwnsListing(listingId, sellerId);
    const count = await this.prisma.listingImage.count({ where: { listingId } });
    if (count >= this.storage.maxImages) {
      throw new BadRequestException(
        `Maximum of ${this.storage.maxImages} images per listing`,
      );
    }
    return this.storage.createListingImageUploadUrl(listingId, sellerId, input);
  }

  async confirmUploads(
    listingId: string,
    sellerId: string,
    input: unknown,
  ): Promise<ListingImage[]> {
    await this.assertSellerOwnsListing(listingId, sellerId);
    const parsed = confirmListingImagesSchema.parse(input);

    const existingCount = await this.prisma.listingImage.count({
      where: { listingId },
    });
    if (existingCount + parsed.keys.length > this.storage.maxImages) {
      throw new BadRequestException(
        `Maximum of ${this.storage.maxImages} images per listing`,
      );
    }

    for (const key of parsed.keys) {
      if (!this.storage.verifyListingImageKey(key, sellerId, listingId)) {
        throw new ForbiddenException('Invalid upload key for this listing');
      }
    }

    const startOrder = existingCount;
    const created = await this.prisma.$transaction(
      parsed.keys.map((key, index) =>
        this.prisma.listingImage.create({
          data: {
            listingId,
            url: this.storage.buildPublicUrl(key),
            sortOrder: parsed.orders?.[index] ?? startOrder + index,
          },
        }),
      ),
    );

    await this.audit.record(listingId, 'image_added', sellerId, {
      metadata: { count: created.length },
    });

    this.eventBus.publish({
      type: 'listing.updated',
      payload: { listingId },
      timestamp: new Date(),
    });

    return created.map(mapListingImage);
  }

  async reorder(
    listingId: string,
    sellerId: string,
    input: unknown,
  ): Promise<ListingImage[]> {
    await this.assertSellerOwnsListing(listingId, sellerId);
    const parsed = reorderListingImagesSchema.parse(input);

    await this.prisma.$transaction(
      parsed.imageOrders.map(({ imageId, order }) =>
        this.prisma.listingImage.updateMany({
          where: { id: imageId, listingId },
          data: { sortOrder: order },
        }),
      ),
    );

    await this.audit.record(listingId, 'image_reordered', sellerId);
    return this.findByListingId(listingId);
  }

  async remove(
    listingId: string,
    imageId: string,
    actorId: string,
    actorRole: RbacRole,
  ): Promise<void> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);

    const isAdmin = actorRole === 'ADMIN' || actorRole === 'SUPER_ADMIN';
    if (!isAdmin && listing.sellerId !== actorId) {
      throw new ForbiddenException('You can only modify your own listing images');
    }

    const result = await this.prisma.listingImage.deleteMany({
      where: { id: imageId, listingId },
    });
    if (result.count === 0) {
      throw new NotFoundException(`Image ${imageId} not found`);
    }

    await this.audit.record(listingId, 'image_removed', actorId, {
      metadata: { imageId },
    });
    this.eventBus.publish({
      type: 'listing.updated',
      payload: { listingId },
      timestamp: new Date(),
    });
  }

  private async assertSellerOwnsListing(listingId: string, sellerId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { sellerId: true },
    });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);
    if (listing.sellerId !== sellerId) {
      throw new ForbiddenException('You can only modify your own listings');
    }
  }
}
