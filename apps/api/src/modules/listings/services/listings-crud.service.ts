import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import type { Listing, RbacRole } from "@community-marketplace/types";
import {
  createListingSchema,
  paginationSchema,
  updateListingSchema,
} from "@community-marketplace/validation";

import { PrismaService } from "../../../database/prisma.service";
import { EventBusService } from "../../../events/event-bus.service";
import { ApiUtilsService } from "../../../utils/api-utils.service";
import {
  listingInclude,
  mapListing,
  mapListingSummaryWithTrust,
  mapListingWithTrust,
} from "../mappers/listing.mapper";
import { ListingAuditService } from "./listing-audit.service";
import { ListingVisibilityService } from "./listing-visibility.service";
import { ListingDeliveryService } from "./listing-delivery.service";
import { SellerTrustService } from "./seller-trust.service";
import { SellerListingGateService } from "../../seller/services/seller-listing-gate.service";
import { computeListingPricing } from "../lib/listing-pricing.lib";
import { CategoriesService } from "./categories.service";
import {
  detectListingFraudSignals,
  isNewSellerAccount,
  NEW_SELLER_DAILY_LISTING_LIMIT,
} from "../lib/listing-fraud.lib";
import { resolvePriceDroppedAt } from "../lib/listing-price-dropped.lib";
import {
  normalizeListingTitle,
  formatLocationLabel,
} from "@community-marketplace/utils";

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
    private readonly sellerTrust: SellerTrustService,
    private readonly sellerListingGate: SellerListingGateService,
  ) {}

  async findPublic(page = 1, limit = 20) {
    const { page: p, limit: l } = paginationSchema.parse({ page, limit });
    const where = this.visibility.visibleListingWhere();

    const [rows, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: listingInclude,
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.listing.count({ where }),
    ]);

    const trustMap = await this.sellerTrust.getSummariesForSellers(rows.map((r) => r.sellerId));

    return this.apiUtils.paginate(
      rows.map((row) => {
        const trust = trustMap.get(row.sellerId);
        return mapListingSummaryWithTrust(
          row,
          undefined,
          trust
            ? {
                averageRating: trust.averageRating,
                reviewCount: trust.reviewCount,
                soldCount: trust.soldCount,
              }
            : undefined,
        );
      }),
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

    if (incrementView && row.status === "active") {
      await this.prisma.listing.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
      row.viewCount += 1;
    }

    const priceDroppedAt = await resolvePriceDroppedAt(this.prisma, id, row);
    const trustProfile = await this.sellerTrust.getProfile(row.sellerId);
    return mapListingWithTrust(row, {
      priceDroppedAt,
      trust: {
        averageRating: trustProfile.averageRating,
        reviewCount: trustProfile.reviewCount,
        soldCount: trustProfile.soldCount,
        responseRate: trustProfile.responseRate,
        responseTimeMinutes: trustProfile.responseTimeMinutes,
      },
    });
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
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return this.apiUtils.paginate(
      rows.map((row) => mapListing(row)),
      p,
      l,
      total,
    );
  }

  async create(
    sellerId: string,
    input: unknown,
  ): Promise<Listing & { sellerNudgeMessage?: string }> {
    const parsed = createListingSchema.parse(input);
    await this.categoriesService.findById(parsed.categoryId);

    const pricingInput = {
      originalPrice: parsed.originalPrice,
      salePrice: parsed.salePrice ?? parsed.price,
      price: parsed.price,
    };
    const computed = computeListingPricing(pricingInput);

    const seller = await this.prisma.user.findUnique({
      where: { id: sellerId },
      select: { createdAt: true },
    });
    if (!seller) {
      throw new NotFoundException("Seller not found");
    }

    await this.sellerListingGate.assertCanCreateListing(sellerId);

    if (isNewSellerAccount(seller.createdAt)) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const createdToday = await this.prisma.listing.count({
        where: { sellerId, createdAt: { gte: startOfDay } },
      });
      if (createdToday >= NEW_SELLER_DAILY_LISTING_LIMIT) {
        throw new BadRequestException(
          `New members can create up to ${NEW_SELLER_DAILY_LISTING_LIMIT} listings per day. Try again tomorrow.`,
        );
      }
    }

    const recentTitles = await this.prisma.listing.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { title: true },
    });
    const fraud = detectListingFraudSignals({
      title: parsed.title,
      price: computed.price,
      recentTitles: recentTitles.map((row) => row.title),
    });

    const row = await this.prisma.listing.create({
      data: {
        sellerId,
        categoryId: parsed.categoryId,
        title: normalizeListingTitle(parsed.title),
        description: parsed.description.trim(),
        price: computed.price,
        originalPrice: computed.originalPrice ?? null,
        salePrice: computed.salePrice ?? computed.price,
        discountPercent: computed.discountPercent ?? null,
        currency: parsed.currency,
        condition: parsed.condition,
        status: "draft",
        locationLabel: formatLocationLabel(parsed.location.label),
        latitude: parsed.location.latitude,
        longitude: parsed.location.longitude,
        requiresFraudReview: fraud.requiresReview,
        ...(parsed.attributes
          ? { attributes: parsed.attributes as Prisma.InputJsonValue }
          : {}),
      },
      include: listingInclude,
    });

    await this.audit.record(row.id, "listing_created", sellerId, {
      toStatus: row.status,
      ...(fraud.requiresReview ? { fraudReasons: fraud.reasons } : {}),
    });

    this.eventBus.publish({
      type: "listing.created",
      payload: { listingId: row.id, sellerId },
      timestamp: new Date(),
    });

    const gateResult = await this.sellerListingGate.onListingCreated(sellerId);

    if (gateResult.nudgeMessage) {
      this.eventBus.publish({
        type: "seller.verification_nudge",
        payload: { sellerId, message: gateResult.nudgeMessage },
        timestamp: new Date(),
      });
    }

    if (parsed.deliverySelections?.length) {
      await this.delivery.saveForDraftListing(
        row.id,
        parsed.deliverySelections,
      );
      const listing = await this.findById(row.id);
      return { ...listing, sellerNudgeMessage: gateResult.nudgeMessage };
    }

    return { ...mapListing(row), sellerNudgeMessage: gateResult.nudgeMessage };
  }

  async update(
    listingId: string,
    actorId: string,
    actorRole: RbacRole,
    input: unknown,
  ): Promise<Listing> {
    const parsed = updateListingSchema.parse(input);
    const existing = await this.getOwnedOrAdmin(listingId, actorId, actorRole);
    const isAdmin = actorRole === "ADMIN" || actorRole === "SUPER_ADMIN";

    if (!isAdmin) {
      await this.sellerListingGate.assertSellerNotSuspended(actorId);
    }

    if (
      !isAdmin &&
      parsed.status !== undefined &&
      parsed.status !== existing.status
    ) {
      throw new ForbiddenException(
        "Only administrators can change listing publication status",
      );
    }

    if (parsed.categoryId) {
      await this.categoriesService.findById(parsed.categoryId);
    }

    if (parsed.deliverySelections !== undefined) {
      if (existing.status === "active") {
        throw new BadRequestException(
          "Use POST /seller/listings/:id/delivery/update to change delivery on active listings",
        );
      }
    }

    const pricingFieldsTouched =
      parsed.price !== undefined ||
      parsed.originalPrice !== undefined ||
      parsed.salePrice !== undefined;

    if (pricingFieldsTouched && existing.status === "active") {
      throw new BadRequestException(
        "Use POST /seller/listings/:id/pricing/update to change prices on active listings",
      );
    }

    let pricingData: {
      price?: number;
      originalPrice?: number | null;
      salePrice?: number | null;
      discountPercent?: number | null;
    } = {};

    if (pricingFieldsTouched && existing.status !== "active") {
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
        ...(parsed.title !== undefined
          ? { title: normalizeListingTitle(parsed.title) }
          : {}),
        ...(parsed.description !== undefined
          ? { description: parsed.description.trim() }
          : {}),
        ...(pricingData.price !== undefined
          ? { price: pricingData.price }
          : {}),
        ...(pricingData.originalPrice !== undefined
          ? { originalPrice: pricingData.originalPrice }
          : {}),
        ...(pricingData.salePrice !== undefined
          ? { salePrice: pricingData.salePrice }
          : {}),
        ...(pricingData.discountPercent !== undefined
          ? { discountPercent: pricingData.discountPercent }
          : {}),
        ...(parsed.currency !== undefined ? { currency: parsed.currency } : {}),
        ...(parsed.categoryId !== undefined
          ? { categoryId: parsed.categoryId }
          : {}),
        ...(parsed.condition !== undefined
          ? { condition: parsed.condition }
          : {}),
        ...(parsed.location
          ? {
              locationLabel: formatLocationLabel(parsed.location.label),
              latitude: parsed.location.latitude,
              longitude: parsed.location.longitude,
            }
          : {}),
        ...(parsed.attributes !== undefined
          ? { attributes: parsed.attributes as Prisma.InputJsonValue }
          : {}),
      },
      include: listingInclude,
    });

    await this.audit.record(listingId, "listing_updated", actorId);

    this.eventBus.publish({
      type: "listing.updated",
      payload: { listingId },
      timestamp: new Date(),
    });

    if (parsed.deliverySelections !== undefined) {
      await this.delivery.saveForDraftListing(
        listingId,
        parsed.deliverySelections,
      );
      return this.findById(listingId);
    }

    return mapListing(row);
  }

  async remove(
    listingId: string,
    actorId: string,
    actorRole: RbacRole,
  ): Promise<void> {
    const isAdmin = actorRole === "ADMIN" || actorRole === "SUPER_ADMIN";
    await this.getOwnedOrAdmin(listingId, actorId, actorRole);
    if (!isAdmin) {
      await this.sellerListingGate.assertSellerNotSuspended(actorId);
    }
    await this.prisma.listing.delete({ where: { id: listingId } });

    await this.audit.record(listingId, "listing_deleted", actorId);

    this.eventBus.publish({
      type: "listing.deleted",
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
              { title: { contains: filters.search, mode: "insensitive" } },
              {
                description: { contains: filters.search, mode: "insensitive" },
              },
              {
                seller: {
                  OR: [
                    {
                      displayName: {
                        contains: filters.search,
                        mode: "insensitive",
                      },
                    },
                    {
                      email: { contains: filters.search, mode: "insensitive" },
                    },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        include: listingInclude,
        orderBy: { createdAt: "desc" },
        skip: (p - 1) * l,
        take: l,
      }),
      this.prisma.listing.count({ where }),
    ]);

    return this.apiUtils.paginate(
      rows.map((row) => mapListing(row)),
      p,
      l,
      total,
    );
  }

  async adminOverride(
    listingId: string,
    adminId: string,
    input: unknown,
  ): Promise<Listing> {
    return this.update(listingId, adminId, "ADMIN", input);
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
      throw new ForbiddenException("You can only duplicate your own listings");
    }

    await this.sellerListingGate.assertCanCreateListing(sellerId);

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
        status: "draft",
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

    await this.audit.record(row.id, "listing_created", sellerId, {
      toStatus: "draft",
      metadata: { duplicatedFrom: listingId },
    });

    const gateResult = await this.sellerListingGate.onListingCreated(sellerId);

    if (gateResult.nudgeMessage) {
      this.eventBus.publish({
        type: "seller.verification_nudge",
        payload: { sellerId, message: gateResult.nudgeMessage },
        timestamp: new Date(),
      });
    }

    const listing = await this.findById(row.id);
    return Object.assign(listing, { sellerNudgeMessage: gateResult.nudgeMessage });
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

    const isAdmin = actorRole === "ADMIN" || actorRole === "SUPER_ADMIN";
    if (!isAdmin && listing.sellerId !== actorId) {
      throw new ForbiddenException("You can only modify your own listings");
    }
    return listing;
  }
}
