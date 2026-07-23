import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import type { Listing, ListingSummary, RbacRole } from "@community-marketplace/types";
import {
  createListingSchema,
  featuredListingsQuerySchema,
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
import { ListingAutoModerationService } from "./listing-auto-moderation.service";
import { ListingKeywordFilterService } from "./listing-keyword-filter.service";
import { ListingReserveService } from "./listing-reserve.service";
import { buildActiveFeaturedWhere } from "../../monetization/lib/featured.lib";
import { computeListingPricing } from "../lib/listing-pricing.lib";
import { CategoriesService } from "./categories.service";
import {
  detectListingFraudSignals,
  isNewSellerAccount,
  NEW_SELLER_DAILY_LISTING_LIMIT,
} from "../lib/listing-fraud.lib";
import { assertVehicleUnitAvailable } from "../lib/listing-vehicle-conflict.lib";
import { resolvePriceDroppedAt } from "../lib/listing-price-dropped.lib";
import {
  normalizeListingTitle,
  formatLocationLabel,
  buildVehicleDisplayTitle,
  normalizeVehicleAttributesForSave,
  parseVehicleAttributes,
  stripVehicleUnitIdentity,
  stripVehicleTitleSuffix,
  buildVehicleListingTitle,
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
    private readonly autoModeration: ListingAutoModerationService,
    private readonly keywordFilters: ListingKeywordFilterService,
    private readonly reserves: ListingReserveService,
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

  async findFeatured(input: unknown): Promise<ListingSummary[]> {
    const query = featuredListingsQuerySchema.parse(input);
    const limit = query.limit ?? 20;
    const now = new Date();

    const rows = await this.prisma.listing.findMany({
      where: this.visibility.visibleListingWhere(
        buildActiveFeaturedWhere(query.placement, now, query.categoryId),
      ),
      include: listingInclude,
      orderBy: [{ featuredUntil: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    const trustMap = await this.sellerTrust.getSummariesForSellers(
      rows.map((row) => row.sellerId),
    );

    return rows.map((row) => {
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
    });
  }

  async resolveListingIdByCompact(compactId: string): Promise<{ id: string }> {
    const normalized = compactId.toLowerCase().replace(/[^0-9a-f]/g, '');
    if (normalized.length !== 8) {
      throw new NotFoundException(`Listing ${compactId} not found`);
    }

    const rows = await this.prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id
      FROM listings
      WHERE RIGHT(REPLACE(id::text, '-', ''), 8) = ${normalized}
      LIMIT 2
    `;

    if (rows.length !== 1) {
      throw new NotFoundException(`Listing ${compactId} not found`);
    }

    return { id: rows[0]!.id };
  }

  async findById(
    id: string,
    incrementView = false,
    viewerId?: string,
  ): Promise<Listing> {
    const row = await this.prisma.listing.findUnique({
      where: { id },
      include: listingInclude,
    });
    if (!row) throw new NotFoundException(`Listing ${id} not found`);

    if (incrementView && (row.status === "active" || row.status === "reserved")) {
      await this.prisma.listing.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
      row.viewCount += 1;
    }

    const priceDroppedAt = await resolvePriceDroppedAt(this.prisma, id, row);
    const trustProfile = await this.sellerTrust.getProfile(row.sellerId);
    const listing = mapListingWithTrust(row, {
      priceDroppedAt,
      trust: {
        averageRating: trustProfile.averageRating,
        reviewCount: trustProfile.reviewCount,
        soldCount: trustProfile.soldCount,
        responseRate: trustProfile.responseRate,
        responseTimeMinutes: trustProfile.responseTimeMinutes,
      },
    });
    listing.reservation = await this.reserves.getSummaryForListing(id, viewerId);
    return listing;
  }

  async findSimilar(listingId: string, limit = 4): Promise<ListingSummary[]> {
    const source = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, categoryId: true },
    });
    if (!source) throw new NotFoundException(`Listing ${listingId} not found`);

    const rows = await this.prisma.listing.findMany({
      where: this.visibility.visibleListingWhere({
        categoryId: source.categoryId,
        id: { not: listingId },
      }),
      include: listingInclude,
      orderBy: { activatedAt: "desc" },
      take: limit,
    });

    const trustMap = await this.sellerTrust.getSummariesForSellers(
      rows.map((row) => row.sellerId),
    );

    return rows.map((row) => {
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

    const recentListings = await this.prisma.listing.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { title: true, attributes: true },
    });

    const normalizedAttributes = parsed.attributes
      ? normalizeVehicleAttributesForSave(parsed.attributes)
      : undefined;

    await assertVehicleUnitAvailable(
      this.prisma,
      sellerId,
      normalizedAttributes,
    );

    const resolvedTitle = resolveVehicleListingTitle(
      parsed.title,
      normalizedAttributes,
    );

    const description = parsed.description.trim();
    const keywordMatch = await this.keywordFilters.assertNotHardBlocked(
      resolvedTitle,
      description,
    );

    const fraud = detectListingFraudSignals({
      title: resolvedTitle,
      price: computed.price,
      recentListings,
      attributes: normalizedAttributes,
    });

    const storeId = await this.resolveStoreIdForSeller(sellerId, parsed.storeId);

    const row = await this.prisma.listing.create({
      data: {
        sellerId,
        storeId,
        categoryId: parsed.categoryId,
        title: resolvedTitle,
        description,
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
        reserveWindowHours: parsed.reserveWindowHours ?? 12,
        ...(normalizedAttributes
          ? { attributes: normalizedAttributes as Prisma.InputJsonValue }
          : {}),
      },
      include: listingInclude,
    });

    await this.audit.record(row.id, "listing_created", sellerId, {
      toStatus: row.status,
      ...(fraud.requiresReview ? { fraudReasons: fraud.reasons } : {}),
      ...(keywordMatch?.tier === "soft"
        ? { keywordSoftMatches: keywordMatch.softMatches }
        : {}),
    });

    this.eventBus.publish({
      type: "listing.created",
      payload: { listingId: row.id, sellerId },
      timestamp: new Date(),
    });

    void this.autoModeration.evaluateOnCreate({
      listingId: row.id,
      sellerId,
      title: resolvedTitle,
      description,
      price: computed.price,
      fraudRequiresReview: fraud.requiresReview,
      fraudReasons: fraud.reasons,
      keywordSoftReasons: this.keywordFilters.formatSoftReasons(keywordMatch),
    });

    if (parsed.deliverySelections?.length) {
      await this.delivery.saveForDraftListing(
        row.id,
        parsed.deliverySelections,
      );
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
      if (existing.status === "active" || existing.status === "reserved") {
        throw new BadRequestException(
          existing.status === "reserved"
            ? "Cannot change delivery while the listing is reserved"
            : "Use POST /seller/listings/:id/delivery/update to change delivery on active listings",
        );
      }
    }

    const pricingFieldsTouched =
      parsed.price !== undefined ||
      parsed.originalPrice !== undefined ||
      parsed.salePrice !== undefined;

    if (pricingFieldsTouched && (existing.status === "active" || existing.status === "reserved")) {
      throw new BadRequestException(
        existing.status === "reserved"
          ? "Cannot change price while the listing is reserved"
          : "Use POST /seller/listings/:id/pricing/update to change prices on active listings",
      );
    }

    if (
      parsed.reserveWindowHours !== undefined &&
      (existing.status === "reserved" ||
        (await this.prisma.listingReserve.findFirst({
          where: { listingId, status: { in: ["pending_seller", "active"] } },
          select: { id: true },
        })))
    ) {
      throw new BadRequestException(
        "Cannot change the reserve window while a reservation is pending or active",
      );
    }

    if (
      parsed.title !== undefined &&
      existing.activatedAt != null &&
      (existing.status === "active" || existing.status === "paused")
    ) {
      throw new BadRequestException(
        "Use POST /seller/listings/:id/title/update to amend the title on previously approved listings",
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

    const mergedAttributes =
      parsed.attributes !== undefined
        ? normalizeVehicleAttributesForSave({
            ...(parseVehicleAttributes(existing.attributes) ?? {}),
            ...(parsed.attributes as Record<string, unknown>),
          })
        : undefined;

    if (mergedAttributes) {
      await assertVehicleUnitAvailable(
        this.prisma,
        existing.sellerId,
        mergedAttributes,
        listingId,
      );
    }

    const resolvedTitle =
      existing.activatedAt != null &&
      (existing.status === "active" || existing.status === "paused")
        ? undefined
        : parsed.title !== undefined || mergedAttributes
          ? resolveVehicleListingTitle(
              parsed.title ?? existing.title,
              mergedAttributes ?? parseVehicleAttributes(existing.attributes),
            )
          : undefined;

    const nextTitle = resolvedTitle ?? existing.title;
    const nextDescription =
      parsed.description !== undefined
        ? parsed.description.trim()
        : existing.description;
    const keywordMatch = await this.keywordFilters.assertNotHardBlocked(
      nextTitle,
      nextDescription,
    );

    const row = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        ...(resolvedTitle !== undefined ? { title: resolvedTitle } : {}),
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
        ...(parsed.reserveWindowHours !== undefined
          ? { reserveWindowHours: parsed.reserveWindowHours }
          : {}),
        ...(parsed.location
          ? {
              locationLabel: formatLocationLabel(parsed.location.label),
              latitude: parsed.location.latitude,
              longitude: parsed.location.longitude,
            }
          : {}),
        ...(mergedAttributes !== undefined
          ? { attributes: mergedAttributes as Prisma.InputJsonValue }
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

    const softReasons = this.keywordFilters.formatSoftReasons(keywordMatch);
    if (
      softReasons.length > 0 &&
      (existing.status === "active" || existing.status === "paused")
    ) {
      await this.autoModeration.queueForKeywordSoftBlock(listingId, softReasons);
    }

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
    const listing = await this.getOwnedOrAdmin(listingId, actorId, actorRole);
    if (!isAdmin) {
      await this.sellerListingGate.assertSellerNotSuspended(actorId);
      const deletable = new Set(["draft", "rejected"]);
      if (!deletable.has(listing.status)) {
        throw new BadRequestException(
          "Published listings cannot be deleted. Pause or end the listing instead.",
        );
      }
    }
    await this.audit.record(listingId, "listing_deleted", actorId);

    await this.prisma.listing.delete({ where: { id: listingId } });

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

    const storeId =
      source.storeId ??
      (await this.resolveStoreIdForSeller(sellerId));

    const sourceAttrs = parseVehicleAttributes(source.attributes);
    const duplicateAttributes = stripVehicleUnitIdentity(source.attributes);
    const duplicateTitle = resolveVehicleListingTitle(
      sourceAttrs?.make
        ? buildVehicleListingTitle(
            sourceAttrs.year ?? sourceAttrs.yearText,
            sourceAttrs.make,
            sourceAttrs.model,
          )
        : stripVehicleTitleSuffix(
            source.title.replace(/\s*\(copy\)\s*$/i, "").trim(),
          ),
      duplicateAttributes,
    );

    const row = await this.prisma.listing.create({
      data: {
        sellerId,
        storeId,
        categoryId: source.categoryId,
        title: duplicateTitle,
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
        ...(duplicateAttributes
          ? { attributes: duplicateAttributes as Prisma.InputJsonValue }
          : {}),
      },
      include: listingInclude,
    });

    if (source.deliveryOptions.length > 0) {
      await this.delivery.saveForDraftListing(
        row.id,
        source.deliveryOptions.map((option) => ({
          deliveryOptionId: option.deliveryOptionId,
          customLabel: option.customLabel ?? undefined,
          customPrice:
            option.customPrice != null ? Number(option.customPrice) : undefined,
        })),
      );
    }

    await this.audit.record(row.id, "listing_created", sellerId, {
      toStatus: "draft",
      metadata: { duplicatedFrom: listingId },
    });

    return mapListing(row);
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

  private async resolveStoreIdForSeller(
    sellerId: string,
    storeId?: string,
  ): Promise<string> {
    if (storeId) {
      const store = await this.prisma.store.findFirst({
        where: { id: storeId, userId: sellerId },
        select: { id: true },
      });
      if (!store) {
        throw new BadRequestException("Store not found");
      }
      return store.id;
    }

    const primary = await this.prisma.store.findFirst({
      where: { userId: sellerId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    if (!primary) {
      throw new BadRequestException(
        "Create your storefront before adding listings.",
      );
    }
    return primary.id;
  }
}

function resolveVehicleListingTitle(
  title: string,
  attributes?: Record<string, unknown> | ReturnType<typeof parseVehicleAttributes>,
): string {
  const attrs = parseVehicleAttributes(attributes);
  if (attrs?.make) {
    return normalizeListingTitle(
      buildVehicleDisplayTitle(
        attrs.year ?? attrs.yearText,
        attrs.make,
        attrs.model,
        attrs,
      ),
    );
  }
  return normalizeListingTitle(title);
}
