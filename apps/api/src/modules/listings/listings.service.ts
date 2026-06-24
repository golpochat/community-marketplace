import { Injectable, NotFoundException } from '@nestjs/common';

import type { Listing } from '@community-marketplace/types';
import { DEFAULT_CURRENCY } from '@community-marketplace/config';
import { paginationSchema } from '@community-marketplace/validation';

import { EventBusService } from '../../events/event-bus.service';
import { ApiUtilsService } from '../../utils/api-utils.service';
import { ListingEntity } from './entities/listing.entity';
import type { CreateListingDto, UpdateListingDto } from './dto/listings.dto';
import { CategoriesService } from './services/categories.service';
import { ListingImagesService } from './services/listing-images.service';

@Injectable()
export class ListingsService {
  private readonly listings = new Map<string, ListingEntity>();

  constructor(
    private readonly apiUtils: ApiUtilsService,
    private readonly categoriesService: CategoriesService,
    private readonly imagesService: ListingImagesService,
    private readonly eventBus: EventBusService,
  ) {
    this.seedListing({
      id: '1',
      sellerId: 'user-1',
      title: 'Vintage Bicycle',
      description: 'Well-maintained vintage bicycle.',
      price: 150,
      categoryId: 'cat-sports',
      location: 'Downtown',
    });
    this.seedListing({
      id: '2',
      sellerId: 'user-2',
      title: 'Office Desk',
      description: 'Solid wood desk.',
      price: 80,
      categoryId: 'cat-furniture',
      location: 'Westside',
    });
  }

  findAll(page = 1, limit = 20) {
    const { page: p, limit: l } = paginationSchema.parse({ page, limit });
    return this.apiUtils.paginate([...this.listings.values()].map((l) => this.toListing(l)), p, l);
  }

  findById(id: string): Listing {
    const listing = this.listings.get(id);
    if (!listing) {
      throw new NotFoundException(`Listing ${id} not found`);
    }
    return this.toListing(listing);
  }

  create(sellerId: string, dto: CreateListingDto): Listing {
    this.categoriesService.findById(dto.categoryId);

    const listing = new ListingEntity();
    listing.id = `listing-${Date.now()}`;
    listing.sellerId = sellerId;
    listing.title = dto.title;
    listing.description = dto.description;
    listing.price = dto.price;
    listing.currency = dto.currency.toUpperCase();
    listing.categoryId = dto.categoryId;
    listing.condition = dto.condition;
    listing.status = 'active';
    listing.location = dto.location;
    listing.createdAt = new Date();
    listing.updatedAt = new Date();

    this.listings.set(listing.id, listing);

    dto.imageUrls?.forEach((url, index) => {
      this.imagesService.add(listing.id, { url, isPrimary: index === 0 });
    });

    this.eventBus.publish({
      type: 'listing.created',
      payload: { listingId: listing.id, sellerId },
      timestamp: new Date(),
    });

    return this.toListing(listing);
  }

  update(id: string, dto: UpdateListingDto): Listing {
    const listing = this.listings.get(id);
    if (!listing) {
      throw new NotFoundException(`Listing ${id} not found`);
    }

    if (dto.categoryId) {
      this.categoriesService.findById(dto.categoryId);
    }

    Object.assign(listing, dto, { updatedAt: new Date() });
    this.listings.set(id, listing);

    this.eventBus.publish({
      type: 'listing.updated',
      payload: { listingId: id },
      timestamp: new Date(),
    });

    return this.toListing(listing);
  }

  remove(id: string): void {
    if (!this.listings.delete(id)) {
      throw new NotFoundException(`Listing ${id} not found`);
    }

    this.eventBus.publish({
      type: 'listing.deleted',
      payload: { listingId: id },
      timestamp: new Date(),
    });
  }

  private toListing(entity: ListingEntity): Listing {
    const images = this.imagesService.findByListingId(entity.id);
    return {
      id: entity.id,
      sellerId: entity.sellerId,
      title: entity.title,
      description: entity.description,
      price: entity.price,
      currency: entity.currency,
      category: entity.categoryId,
      condition: entity.condition,
      status: entity.status,
      location: entity.location,
      imageUrls: images.map((img) => img.url),
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }

  private seedListing(data: {
    id: string;
    sellerId: string;
    title: string;
    description: string;
    price: number;
    categoryId: string;
    location: string;
  }) {
    const listing = new ListingEntity();
    Object.assign(listing, {
      ...data,
      currency: DEFAULT_CURRENCY,
      condition: 'good',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    this.listings.set(data.id, listing);
  }
}
