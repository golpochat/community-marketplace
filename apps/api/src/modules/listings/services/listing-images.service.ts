import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import type { ListingImage, RbacRole } from '@community-marketplace/types';
import {
  confirmListingImagesSchema,
  reorderListingImagesSchema,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { mapListingImage } from '../mappers/listing.mapper';
import { SellerListingGateService } from '../../seller/services/seller-listing-gate.service';
import { ListingAuditService } from './listing-audit.service';
import { ListingAutoModerationService } from './listing-auto-moderation.service';
import { ListingImageProcessorService } from './listing-image-processor.service';
import { ListingR2StorageService } from './listing-r2-storage.service';
import { DevUploadService } from '../../dev-upload/dev-upload.service';
import { R2StorageService } from '../../users/services/r2-storage.service';

@Injectable()
export class ListingImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: ListingR2StorageService,
    private readonly processor: ListingImageProcessorService,
    private readonly audit: ListingAuditService,
    private readonly eventBus: EventBusService,
    private readonly sellerListingGate: SellerListingGateService,
    private readonly autoModeration: ListingAutoModerationService,
    private readonly r2: R2StorageService,
    private readonly devUpload: DevUploadService,
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

    const processed = await Promise.all(
      parsed.keys.map(async (key) => {
        try {
          return await this.processor.processListingImage(key);
        } catch {
          return {
            key,
            publicUrl: this.storage.buildPublicUrl(key),
          };
        }
      }),
    );

    const startOrder = existingCount;
    const created = await this.prisma.$transaction(
      processed.map((item, index) =>
        this.prisma.listingImage.create({
          data: {
            listingId,
            url: item.publicUrl,
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

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true, description: true },
    });
    if (listing) {
      const prohibited = ['weapon', 'drug', 'counterfeit', 'fake-id'];
      const haystack = `${listing.title} ${listing.description} ${parsed.keys.join(' ')}`.toLowerCase();
      const hit = prohibited.find((term) => haystack.includes(term));
      if (hit) {
        void this.autoModeration.onProhibitedContent(listingId, hit);
      }
    }

    return created.map(mapListingImage);
  }

  /**
   * Attach a processed marketing image buffer as a new listing photo
   * (runs through the normal Sharp variant pipeline).
   */
  async addImageFromBuffer(
    listingId: string,
    sellerId: string,
    buffer: Buffer,
  ): Promise<ListingImage[]> {
    await this.assertSellerOwnsListing(listingId, sellerId);

    const existingCount = await this.prisma.listingImage.count({
      where: { listingId },
    });
    if (existingCount >= this.storage.maxImages) {
      throw new BadRequestException(
        `Maximum of ${this.storage.maxImages} images per listing`,
      );
    }

    const sourceKey = `listing-images/${sellerId}/${listingId}/${randomUUID()}.webp`;
    if (this.r2.isConfigured()) {
      await this.r2.putObject(sourceKey, buffer, 'image/webp');
    } else {
      await this.devUpload.save(sourceKey, buffer);
    }

    let processed: { key: string; publicUrl: string };
    try {
      processed = await this.processor.processListingImage(sourceKey);
    } catch {
      processed = {
        key: sourceKey,
        publicUrl: this.storage.buildPublicUrl(sourceKey),
      };
    }

    const created = await this.prisma.listingImage.create({
      data: {
        listingId,
        url: processed.publicUrl,
        sortOrder: existingCount,
      },
    });

    await this.audit.record(listingId, 'image_added', sellerId, {
      metadata: { source: 'ai_marketing_hub', count: 1 },
    });

    this.eventBus.publish({
      type: 'listing.updated',
      payload: { listingId },
      timestamp: new Date(),
    });

    return [mapListingImage(created)];
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
    if (!isAdmin) {
      await this.sellerListingGate.assertSellerNotSuspended(actorId);
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
    await this.sellerListingGate.assertSellerNotSuspended(sellerId);
  }
}
