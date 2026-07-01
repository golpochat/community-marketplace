import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  BoostIntentResponse,
  BoostPackageType,
  FastTrackIntentResponse,
  FastTrackStatusResponse,
  FeaturedIntentResponse,
  FeaturedPlacement,
  PlatformPurchase,
  StoreSlotIntentResponse,
} from '@community-marketplace/types';
import type {
  ConfirmBoostInput,
  ConfirmFastTrackInput,
  ConfirmFeaturedInput,
  ConfirmStoreSlotInput,
  CreateBoostIntentInput,
  CreateFeaturedIntentInput,
  CreateStoreSlotIntentInput,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { EventBusService } from '../../../events/event-bus.service';
import { LoggerLib } from '../../../libs/logger.lib';
import { StripeConnectService } from '../../payments/services/stripe-connect.service';
import {
  boostSkuKey,
  roundMoney,
} from '../lib/boost.lib';
import {
  buildActiveFeaturedWhere,
  featuredSkuKey,
  slotsPerDayForPlacement,
} from '../lib/featured.lib';
import { mapPlatformPurchase } from '../mappers/monetization.mapper';
import { BoostCatalogService } from './boost-catalog.service';
import { BoostFulfillmentService } from './boost-fulfillment.service';
import {
  FAST_TRACK_COOLDOWN_DAYS,
  FastTrackFulfillmentService,
} from './fast-track-fulfillment.service';
import { FeaturedCatalogService } from './featured-catalog.service';
import { FeaturedFulfillmentService } from './featured-fulfillment.service';
import { PlatformSettingsService } from './platform-settings.service';
import { StoreSlotCatalogService } from './store-slot-catalog.service';
import { StoreSlotFulfillmentService } from './store-slot-fulfillment.service';
import { PlatformPurchaseReceiptService } from './platform-purchase-receipt.service';
import { BuyerStatementPurchaseService } from '../../statements/services/buyer-statement-purchase.service';
import { slotsGrantedBySku, targetStoreSlotLimit } from '../lib/store-slot.lib';

const DAILY_INTENT_LIMIT = 10;

@Injectable()
export class PlatformPurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: PlatformSettingsService,
    private readonly boostCatalog: BoostCatalogService,
    private readonly featuredCatalog: FeaturedCatalogService,
    private readonly boostFulfillment: BoostFulfillmentService,
    private readonly featuredFulfillment: FeaturedFulfillmentService,
    private readonly fastTrackFulfillment: FastTrackFulfillmentService,
    private readonly storeSlotCatalog: StoreSlotCatalogService,
    private readonly storeSlotFulfillment: StoreSlotFulfillmentService,
    private readonly stripeConnect: StripeConnectService,
    private readonly purchaseReceipts: PlatformPurchaseReceiptService,
    @Inject(forwardRef(() => BuyerStatementPurchaseService))
    private readonly buyerStatementPurchases: BuyerStatementPurchaseService,
    private readonly eventBus: EventBusService,
    private readonly logger: LoggerLib,
  ) {}

  async createBoostIntent(
    sellerId: string,
    dto: CreateBoostIntentInput,
  ): Promise<BoostIntentResponse> {
    await this.assertIntentRateLimit(sellerId, 'listing_boost');

    const catalog = await this.boostCatalog.getCatalog(sellerId, dto.listingId);
    const option = catalog.options.find((item) => item.packageType === dto.packageType);
    if (!option?.eligible) {
      throw new BadRequestException(
        option?.reason ?? 'This listing is not eligible for a boost',
      );
    }

    const settings = await this.settings.get();
    const amount = await this.resolveBoostPrice(
      sellerId,
      dto.packageType,
      settings.pricing.skus[boostSkuKey(dto.packageType)].amount,
    );

    const purchase = await this.prisma.platformPurchase.create({
      data: {
        userId: sellerId,
        type: 'listing_boost',
        status: 'pending',
        amount,
        currency: settings.pricing.currency.toUpperCase(),
        listingId: dto.listingId,
        packageType: dto.packageType,
        metadata: {
          boostDays: dto.packageType === 'PAID_7D' ? 7 : 30,
          priceAtPurchase: amount,
        },
      },
    });

    const { providerPaymentId, clientSecret } = await this.createStripeIntent(
      amount,
      settings.pricing.currency,
      {
        type: 'listing_boost',
        listingId: dto.listingId,
        userId: sellerId,
        packageType: dto.packageType,
        platformPurchaseId: purchase.id,
      },
      'boost',
    );

    const updated = await this.prisma.platformPurchase.update({
      where: { id: purchase.id },
      data: { providerPaymentId, clientSecret },
    });

    return {
      purchase: mapPlatformPurchase(updated),
      clientSecret,
    };
  }

  async confirmBoost(sellerId: string, dto: ConfirmBoostInput): Promise<PlatformPurchase> {
    return this.confirmPurchase(sellerId, dto.purchaseId, (id) =>
      this.boostFulfillment.fulfillListingBoost(id),
    );
  }

  async createFeaturedIntent(
    sellerId: string,
    dto: CreateFeaturedIntentInput,
  ): Promise<FeaturedIntentResponse> {
    await this.assertIntentRateLimit(sellerId, 'featured_slot');

    const categoryId =
      dto.placement === 'category' ? dto.categoryId : undefined;
    const catalog = await this.featuredCatalog.getCatalog(
      sellerId,
      dto.listingId,
      categoryId,
    );
    const option = catalog.options.find((item) => item.placement === dto.placement);
    if (!option?.eligible) {
      throw new BadRequestException(
        option?.reason ?? 'This listing is not eligible for featured placement',
      );
    }

    const settings = await this.settings.get();
    const sku = settings.pricing.skus[featuredSkuKey(dto.placement)];
    const amount = roundMoney(sku?.amount ?? 0);

    const purchase = await this.prisma.platformPurchase.create({
      data: {
        userId: sellerId,
        type: 'featured_slot',
        status: 'pending',
        amount,
        currency: settings.pricing.currency.toUpperCase(),
        listingId: dto.listingId,
        metadata: {
          placement: dto.placement,
          categoryId: categoryId ?? null,
          priceAtPurchase: amount,
        },
      },
    });

    const { providerPaymentId, clientSecret } = await this.createStripeIntent(
      amount,
      settings.pricing.currency,
      {
        type: 'featured_slot',
        listingId: dto.listingId,
        userId: sellerId,
        placement: dto.placement,
        categoryId: categoryId ?? '',
        platformPurchaseId: purchase.id,
      },
      'featured',
    );

    const updated = await this.prisma.platformPurchase.update({
      where: { id: purchase.id },
      data: { providerPaymentId, clientSecret },
    });

    return {
      purchase: mapPlatformPurchase(updated),
      clientSecret,
    };
  }

  async confirmFeatured(
    sellerId: string,
    dto: ConfirmFeaturedInput,
  ): Promise<PlatformPurchase> {
    return this.confirmPurchase(sellerId, dto.purchaseId, (id) =>
      this.featuredFulfillment.fulfillFeaturedSlot(id),
    );
  }

  async getFastTrackStatus(sellerId: string): Promise<FastTrackStatusResponse> {
    const settings = await this.settings.get();
    const sku = settings.pricing.skus.fast_track_verification;
    const price = sku?.amount ?? 0;
    const enabled = Boolean(sku?.enabled);

    const pendingRequest = await this.prisma.sellerVerificationRequest.findFirst({
      where: {
        userId: sellerId,
        status: 'pending',
        user: { verificationRequestedAt: { not: null } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingPurchase = await this.prisma.platformPurchase.findFirst({
      where: {
        userId: sellerId,
        type: 'fast_track_verification',
        status: 'pending',
      },
      orderBy: { createdAt: 'desc' },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: sellerId },
      select: { sellerStatus: true },
    });

    const { eligible, reason, nextEligibleAt } = await this.evaluateFastTrackEligibility(
      sellerId,
      user.sellerStatus,
      enabled,
    );

    return {
      enabled,
      currency: settings.pricing.currency,
      price,
      eligible,
      reason,
      hasPriority: pendingRequest?.priority ?? false,
      pendingPurchase: pendingPurchase
        ? mapPlatformPurchase(pendingPurchase)
        : undefined,
      nextEligibleAt,
    };
  }

  async createFastTrackIntent(sellerId: string): Promise<FastTrackIntentResponse> {
    await this.assertIntentRateLimit(sellerId, 'fast_track_verification');

    const status = await this.getFastTrackStatus(sellerId);
    if (!status.eligible) {
      throw new BadRequestException(status.reason ?? 'Fast-track verification is not available');
    }

    const settings = await this.settings.get();
    const amount = roundMoney(status.price);

    const purchase = await this.prisma.platformPurchase.create({
      data: {
        userId: sellerId,
        type: 'fast_track_verification',
        status: 'pending',
        amount,
        currency: settings.pricing.currency.toUpperCase(),
        metadata: {
          priceAtPurchase: amount,
        },
      },
    });

    const { providerPaymentId, clientSecret } = await this.createStripeIntent(
      amount,
      settings.pricing.currency,
      {
        type: 'fast_track_verification',
        userId: sellerId,
        platformPurchaseId: purchase.id,
      },
      'fast_track',
    );

    const updated = await this.prisma.platformPurchase.update({
      where: { id: purchase.id },
      data: { providerPaymentId, clientSecret },
    });

    return {
      purchase: mapPlatformPurchase(updated),
      clientSecret,
    };
  }

  async confirmFastTrack(
    sellerId: string,
    dto: ConfirmFastTrackInput,
  ): Promise<PlatformPurchase> {
    return this.confirmPurchase(sellerId, dto.purchaseId, (id) =>
      this.fastTrackFulfillment.fulfillFastTrack(id),
    );
  }

  async getStoreSlotCatalog(sellerId: string) {
    return this.storeSlotCatalog.getCatalog(sellerId);
  }

  async createStoreSlotIntent(
    sellerId: string,
    dto: CreateStoreSlotIntentInput,
  ): Promise<StoreSlotIntentResponse> {
    await this.assertIntentRateLimit(sellerId, dto.sku);
    const amount = await this.storeSlotCatalog.assertSkuEligible(sellerId, dto.sku);

    const settings = await this.settings.get();
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: sellerId },
      select: { storeSlotLimit: true },
    });
    const slotsGranted = slotsGrantedBySku(dto.sku, user.storeSlotLimit);
    const targetLimit = targetStoreSlotLimit(dto.sku);

    const purchase = await this.prisma.platformPurchase.create({
      data: {
        userId: sellerId,
        type: dto.sku,
        status: 'pending',
        amount,
        currency: settings.pricing.currency.toUpperCase(),
        metadata: {
          sku: dto.sku,
          slotsGranted,
          targetStoreSlotLimit: targetLimit,
          priceAtPurchase: amount,
        },
      },
    });

    const { providerPaymentId, clientSecret } = await this.createStripeIntent(
      amount,
      settings.pricing.currency,
      {
        type: dto.sku,
        userId: sellerId,
        platformPurchaseId: purchase.id,
      },
      'store_slot',
    );

    const updated = await this.prisma.platformPurchase.update({
      where: { id: purchase.id },
      data: { providerPaymentId, clientSecret },
    });

    return {
      purchase: mapPlatformPurchase(updated),
      clientSecret,
    };
  }

  async confirmStoreSlot(
    sellerId: string,
    dto: ConfirmStoreSlotInput,
  ): Promise<PlatformPurchase> {
    return this.confirmPurchase(sellerId, dto.purchaseId, (id) =>
      this.storeSlotFulfillment.fulfillStoreSlot(id),
    );
  }

  async handlePaymentIntentSucceeded(providerPaymentId: string): Promise<boolean> {
    const purchase = await this.prisma.platformPurchase.findFirst({
      where: { providerPaymentId },
    });
    if (!purchase) return false;

    let fulfilled = false;
    switch (purchase.type) {
      case 'listing_boost':
        fulfilled = await this.boostFulfillment.fulfillListingBoost(purchase.id);
        break;
      case 'featured_slot':
        fulfilled = await this.featuredFulfillment.fulfillFeaturedSlot(purchase.id);
        break;
      case 'fast_track_verification':
        fulfilled = await this.fastTrackFulfillment.fulfillFastTrack(purchase.id);
        break;
      case 'store_slot_2':
      case 'store_slot_3':
      case 'store_bundle_3':
        fulfilled = await this.storeSlotFulfillment.fulfillStoreSlot(purchase.id);
        break;
      case 'buyer_statement':
        await this.buyerStatementPurchases.fulfillFromWebhook(purchase.id);
        return true;
      default:
        return false;
    }

    if (fulfilled) {
      await this.afterPurchaseSucceeded(purchase.id);
    }
    return fulfilled;
  }

  async listSellerPurchases(sellerId: string, page = 1, limit = 20) {
    const where = { userId: sellerId, status: 'succeeded' as const };
    const [rows, total] = await Promise.all([
      this.prisma.platformPurchase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.platformPurchase.count({ where }),
    ]);
    return {
      data: rows.map(mapPlatformPurchase),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async handlePaymentIntentFailed(providerPaymentId: string): Promise<boolean> {
    const purchase = await this.prisma.platformPurchase.findFirst({
      where: { providerPaymentId },
    });
    if (!purchase) return false;
    await this.prisma.platformPurchase.update({
      where: { id: purchase.id },
      data: { status: 'failed' },
    });
    return true;
  }

  async listAdmin(filters: {
    page: number;
    limit: number;
    type?:
      | 'listing_boost'
      | 'featured_slot'
      | 'fast_track_verification'
      | 'store_slot_2'
      | 'store_slot_3'
      | 'store_bundle_3'
      | 'buyer_statement';
    status?: 'pending' | 'succeeded' | 'failed' | 'refunded';
    userId?: string;
  }) {
    const where = {
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.platformPurchase.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      this.prisma.platformPurchase.count({ where }),
    ]);
    return {
      data: rows.map(mapPlatformPurchase),
      meta: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  private async confirmPurchase(
    sellerId: string,
    purchaseId: string,
    fulfill: (purchaseId: string) => Promise<boolean>,
  ): Promise<PlatformPurchase> {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    if (purchase.userId !== sellerId) {
      throw new ForbiddenException('You can only confirm your own purchases');
    }

    const stripe = this.stripeConnect.getStripeClient();
    if (stripe && purchase.providerPaymentId) {
      const intent = await stripe.paymentIntents.retrieve(purchase.providerPaymentId);
      if (intent.status === 'succeeded') {
        await fulfill(purchase.id);
      } else if (intent.status === 'canceled') {
        await this.prisma.platformPurchase.update({
          where: { id: purchase.id },
          data: { status: 'failed' },
        });
      }
    } else {
      await fulfill(purchase.id);
    }

    const row = await this.prisma.platformPurchase.findUniqueOrThrow({
      where: { id: purchase.id },
    });
    if (row.status === 'succeeded') {
      await this.afterPurchaseSucceeded(row.id);
    }
    return mapPlatformPurchase(row);
  }

  private async afterPurchaseSucceeded(purchaseId: string) {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: purchaseId },
      select: { id: true, userId: true, type: true, status: true, receiptGeneratedAt: true },
    });
    if (!purchase || purchase.status !== 'succeeded') return;
    if (purchase.type === 'buyer_statement') return;

    if (!purchase.receiptGeneratedAt) {
      this.eventBus.publish({
        type: 'platform_purchase.succeeded',
        payload: { purchaseId: purchase.id, userId: purchase.userId, type: purchase.type },
        timestamp: new Date(),
      });
    }

    void this.purchaseReceipts.generateForPurchase(purchaseId).catch((error) => {
      this.logger.error(
        'PlatformPurchaseService',
        `Failed to generate invoice for purchase ${purchaseId}`,
        error instanceof Error ? error.stack : undefined,
      );
    });
  }

  private async createStripeIntent(
    amount: number,
    currency: string,
    metadata: Record<string, string>,
    devPrefix: string,
  ) {
    const stripe = this.stripeConnect.getStripeClient();
    const normalizedCurrency = currency.toLowerCase();

    if (stripe) {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: normalizedCurrency,
        metadata,
      });
      return {
        providerPaymentId: intent.id,
        clientSecret: intent.client_secret ?? '',
      };
    }

    return {
      providerPaymentId: `pi_dev_${devPrefix}_${Date.now()}`,
      clientSecret: `pi_dev_${devPrefix}_secret_${Date.now()}`,
    };
  }

  private async assertIntentRateLimit(
    sellerId: string,
    type:
      | 'listing_boost'
      | 'featured_slot'
      | 'fast_track_verification'
      | 'store_slot_2'
      | 'store_slot_3'
      | 'store_bundle_3',
  ) {
    const since = new Date();
    since.setHours(since.getHours() - 24);
    const count = await this.prisma.platformPurchase.count({
      where: {
        userId: sellerId,
        type,
        createdAt: { gte: since },
      },
    });
    if (count >= DAILY_INTENT_LIMIT) {
      throw new HttpException(
        'Purchase limit reached for today',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async resolveBoostPrice(
    sellerId: string,
    packageType: BoostPackageType,
    basePrice: number,
  ) {
    const settings = await this.settings.get();
    const discountPercent = settings.pricing.promos?.first_boost_discount_percent ?? 0;
    if (discountPercent <= 0) return roundMoney(basePrice);

    const priorSuccess = await this.prisma.platformPurchase.count({
      where: {
        userId: sellerId,
        type: 'listing_boost',
        status: 'succeeded',
      },
    });
    if (priorSuccess > 0) return roundMoney(basePrice);

    return roundMoney(basePrice * (1 - discountPercent / 100));
  }

  private async evaluateFastTrackEligibility(
    sellerId: string,
    sellerStatus: string,
    skuEnabled: boolean,
  ): Promise<{ eligible: boolean; reason?: string; nextEligibleAt?: string }> {
    if (!skuEnabled) {
      return { eligible: false, reason: 'fast_track_disabled' };
    }
    if (sellerStatus === 'verified') {
      return { eligible: false, reason: 'already_verified' };
    }
    if (sellerStatus === 'suspended') {
      return { eligible: false, reason: 'seller_suspended' };
    }

    const since = new Date();
    since.setDate(since.getDate() - FAST_TRACK_COOLDOWN_DAYS);

    const recentSuccess = await this.prisma.platformPurchase.findFirst({
      where: {
        userId: sellerId,
        type: 'fast_track_verification',
        status: 'succeeded',
        fulfilledAt: { gte: since },
      },
      orderBy: { fulfilledAt: 'desc' },
    });

    if (recentSuccess?.fulfilledAt) {
      const nextEligibleAt = new Date(recentSuccess.fulfilledAt);
      nextEligibleAt.setDate(nextEligibleAt.getDate() + FAST_TRACK_COOLDOWN_DAYS);
      return {
        eligible: false,
        reason: 'cooldown_active',
        nextEligibleAt: nextEligibleAt.toISOString(),
      };
    }

    const pendingSuccess = await this.prisma.platformPurchase.findFirst({
      where: {
        userId: sellerId,
        type: 'fast_track_verification',
        status: 'succeeded',
        metadata: {
          path: ['applied'],
          equals: false,
        },
      },
    });
    if (pendingSuccess) {
      return { eligible: false, reason: 'pending_application' };
    }

    const unappliedPurchase = await this.prisma.platformPurchase.findFirst({
      where: {
        userId: sellerId,
        type: 'fast_track_verification',
        status: 'succeeded',
      },
      orderBy: { fulfilledAt: 'desc' },
    });
    if (
      unappliedPurchase &&
      this.fastTrackFulfillment.readMetadata(unappliedPurchase.metadata).applyOnSubmit === true
    ) {
      return { eligible: false, reason: 'pending_application' };
    }

    return { eligible: true };
  }

  async assertFeaturedSlotsAvailable(
    placement: FeaturedPlacement,
    categoryId?: string,
  ): Promise<void> {
    const settings = await this.settings.get();
    const slotsPerDay = slotsPerDayForPlacement(
      placement,
      settings.pricing.featured ?? {},
    );
    const now = new Date();
    const slotsUsed = await this.prisma.listing.count({
      where: buildActiveFeaturedWhere(placement, now, categoryId),
    });
    if (slotsUsed >= slotsPerDay) {
      throw new BadRequestException('Featured slots are full');
    }
  }
}
