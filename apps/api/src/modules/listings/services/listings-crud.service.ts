import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { Listing, RbacRole } from '@community-marketplace/types';
import {
  createListingSchema,
  paginationSchema,
  updateListingSchema,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { ApiUtilsService } from '../../../utils/api-utils.service';
import {
  listingInclude,
  mapListing,
  mapListingSummary,
} from '../mappers/listing.mapper';
import { ListingAuditService } from './listing-audit.service';
import { ListingVisibilityService } from './listing-visibility.service';
import { ListingDeliveryService } from './listing-delivery.service';
import { computeListingPricing } from '../lib/listing-pricing.lib';
import { CategoriesService } from './categories.service';

@Injectable()
export class ListingsCrudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiUtils: ApiUtilsService,
    private readonly categoriesService: CategoriesService,
    private readonly audit: ListingAuditService,
    private readonly visibility: ListingVisibilityService,
    private readonly delivery: ListingDeliveryService,
    private readonly eventBus: EventBusService,
  ) {}

  async findPublic(page = 1, limit = 20) {
    const { page: p, limit: l } = paginationSchema.parse({ page, limit });
    const where = this.visibility.visibleListingWhere();

    const [rows, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: listingInclude,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return this.apiUtils.paginate(
      rows.map((row) => mapListingSummary(row)),
      p,
      l,
      total,
    );
  }

  async findById(id: string, incrementView = false): Promise<Listing> {
    const row = await this.prisma.listing.findUnique({
      where: { id },
      include: listingInclude,
    });
    if (!row) throw new NotFoundException(`Listing ${id} not found`);

    if (incrementView && row.status === 'active') {
      await this.prisma.listing.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
      row.viewCount += 1;
    }

    return mapListing(row);
  }

  async findBySeller(
    sellerId: string,
    filters: { status?: string; page?: number; limit?: number },
  ) {
    const { page: p, limit: l } = paginationSchema.parse({
      page: filters.page,
      limit: filters.limit,
    });
    const where: Prisma.ListingWhereInput = {
      sellerId,
      ...(filters.status ? { status: filters.status as never } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: listingInclude,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return this.apiUtils.paginate(rows.map((row) => mapListing(row)), p, l, total);
  }

  async create(sellerId: string, input: unknown): Promise<Listing> {
    const parsed = createListingSchema.parse(input);
    await this.categoriesService.findById(parsed.categoryId);

    const pricingInput = {
      originalPrice: parsed.originalPrice,
      salePrice: parsed.salePrice ?? parsed.price,
      price: parsed.price,
    };
    const computed = computeListingPricing(pricingInput);

    const row = await this.prisma.listing.create({
      data: {
        sellerId,
        categoryId: parsed.categoryId,
        title: parsed.title,
        description: parsed.description,
        price: computed.price,
        originalPrice: computed.originalPrice ?? null,
        salePrice: computed.salePrice ?? computed.price,
        discountPercent: computed.discountPercent ?? null,
        currency: parsed.currency,
        condition: parsed.condition,
        status: 'draft',
        locationLabel: parsed.location.label,
        latitude: parsed.location.latitude,
        longitude: parsed.location.longitude,
      },
      include: listingInclude,
    });

    await this.audit.record(row.id, 'listing_created', sellerId, {
      toStatus: row.status,
    });

    this.eventBus.publish({
      type: 'listing.created',
      payload: { listingId: row.id, sellerId },
      timestamp: new Date(),
    });

    if (parsed.deliverySelections?.length) {
      await this.delivery.saveForDraftListing(row.id, parsed.deliverySelections);
      return this.findById(row.id);
    }

    return mapListing(row);
  }

  async update(
    listingId: string,
    actorId: string,
    actorRole: RbacRole,
    input: unknown,
  ): Promise<Listing> {
    const parsed = updateListingSchema.parse(input);
    const existing = await this.getOwnedOrAdmin(listingId, actorId, actorRole);
    const isAdmin = actorRole === 'ADMIN' || actorRole === 'SUPER_ADMIN';

    if (!isAdmin && parsed.status !== undefined && parsed.status !== existing.status) {
      throw new ForbiddenException('Only administrators can change listing publication status');
    }

    if (parsed.categoryId) {
      await this.categoriesService.findById(parsed.categoryId);
    }

    if (parsed.deliverySelections !== undefined) {
      if (existing.status === 'active') {
        throw new BadRequestException(
          'Use POST /seller/listings/:id/delivery/update to change delivery on active listings',
        );
      }
    }

    const pricingFieldsTouched =
      parsed.price !== undefined ||
      parsed.originalPrice !== undefined ||
      parsed.salePrice !== undefined;

    if (pricingFieldsTouched && existing.status === 'active') {
      throw new BadRequestException(
        'Use POST /seller/listings/:id/pricing/update to change prices on active listings',
      );
    }

    let pricingData: {
      price?: number;
      originalPrice?: number | null;
      salePrice?: number | null;
      discountPercent?: number | null;
    } = {};

    if (pricingFieldsTouched && existing.status !== 'active') {
      const computed = computeListingPricing({
        originalPrice: parsed.originalPrice ?? undefined,
        salePrice: parsed.salePrice ?? parsed.price,
        price: parsed.price ?? Number(existing.price),
      });
      pricingData = {
        price: computed.price,
        originalPrice: computed.originalPrice ?? null,
        salePrice: computed.salePrice ?? computed.price,
        discountPercent: computed.discountPercent ?? null,
      };
    }

    const row = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        ...(parsed.title !== undefined ? { title: parsed.title } : {}),
        ...(parsed.description !== undefined
          ? { description: parsed.description }
          : {}),
        ...(pricingData.price !== undefined ? { price: pricingData.price } : {}),
        ...(pricingData.originalPrice !== undefined
          ? { originalPrice: pricingData.originalPrice }
          : {}),
        ...(pricingData.salePrice !== undefined ? { salePrice: pricingData.salePrice } : {}),
        ...(pricingData.discountPercent !== undefined
          ? { discountPercent: pricingData.discountPercent }
          : {}),
        ...(parsed.currency !== undefined ? { currency: parsed.currency } : {}),
        ...(parsed.categoryId !== undefined
          ? { categoryId: parsed.categoryId }
          : {}),
        ...(parsed.condition !== undefined ? { condition: parsed.condition } : {}),
        ...(parsed.location
          ? {
              locationLabel: parsed.location.label,
              latitude: parsed.location.latitude,
              longitude: parsed.location.longitude,
            }
          : {}),
      },
      include: listingInclude,
    });

    await this.audit.record(listingId, 'listing_updated', actorId);

    this.eventBus.publish({
      type: 'listing.updated',
      payload: { listingId },
      timestamp: new Date(),
    });

    if (parsed.deliverySelections !== undefined) {
      await this.delivery.saveForDraftListing(listingId, parsed.deliverySelections);
      return this.findById(listingId);
    }

    return mapListing(row);
  }

  async remove(
    listingId: string,
    actorId: string,
    actorRole: RbacRole,
  ): Promise<void> {
    await this.getOwnedOrAdmin(listingId, actorId, actorRole);
    await this.prisma.listing.delete({ where: { id: listingId } });

    await this.audit.record(listingId, 'listing_deleted', actorId);

    this.eventBus.publish({
      type: 'listing.deleted',
      payload: { listingId },
      timestamp: new Date(),
    });
  }

  async adminList(filters: {
    status?: string;
    categoryId?: string;
    sellerId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { page: p, limit: l } = paginationSchema.parse({
      page: filters.page,
      limit: filters.limit,
    });

    const where: Prisma.ListingWhereInput = {
      ...(filters.status ? { status: filters.status as never } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters.sellerId ? { sellerId: filters.sellerId } : {}),
      ...(filters.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: listingInclude,
        orderBy: { createdAt: 'desc' },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return this.apiUtils.paginate(rows.map((row) => mapListing(row)), p, l, total);
  }

  async adminOverride(
    listingId: string,
    adminId: string,
    input: unknown,
  ): Promise<Listing> {
    return this.update(listingId, adminId, 'ADMIN', input);
  }

  async duplicate(listingId: string, sellerId: string): Promise<Listing> {
    const source = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        ...listingInclude,
        deliveryOptions: { include: { deliveryOption: true } },
      },
    });
    if (!source) throw new NotFoundException(`Listing ${listingId} not found`);
    if (source.sellerId !== sellerId) {
      throw new ForbiddenException('You can only duplicate your own listings');
    }

    const row = await this.prisma.listing.create({
      data: {
        sellerId,
        categoryId: source.categoryId,
        title: `${source.title} (copy)`,
        description: source.description,
        price: source.price,
        originalPrice: source.originalPrice,
        salePrice: source.salePrice,
        discountPercent: source.discountPercent,
        currency: source.currency,
        condition: source.condition,
        status: 'draft',
        packageType: source.packageType,
        isPaid: false,
        locationLabel: source.locationLabel,
        latitude: source.latitude,
        longitude: source.longitude,
      },
      include: listingInclude,
    });

    if (source.images.length > 0) {
      await this.prisma.listingImage.createMany({
        data: source.images.map((img, index) => ({
          listingId: row.id,
          url: img.url,
          sortOrder: index,
        })),
      });
    }

    await this.audit.record(row.id, 'listing_created', sellerId, {
      toStatus: 'draft',
      metadata: { duplicatedFrom: listingId },
    });

    return this.findById(row.id);
  }

  private async getOwnedOrAdmin(
    listingId: string,
    actorId: string,
    actorRole: RbacRole,
  ) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException(`Listing ${listingId} not found`);

    const isAdmin = actorRole === 'ADMIN' || actorRole === 'SUPER_ADMIN';
    if (!isAdmin && listing.sellerId !== actorId) {
      throw new ForbiddenException('You can only modify your own listings');
    }
    return listing;
  }
}
