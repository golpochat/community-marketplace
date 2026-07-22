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
  AiCreditPackCatalogResponse,
  AiCreditPackIntentResponse,
  BoostIntentResponse,
  BoostPackageType,
  EarlyCashbackUnlockIntentResponse,
  FastTrackIntentResponse,
  FastTrackStatusResponse,
  FeaturedIntentResponse,
  FeaturedPlacement,
  FeaturedStoreIntentResponse,
  GrowthPackCatalogResponse,
  GrowthPackIntentResponse,
  PlatformPurchase,
  StoreSlotIntentResponse,
} from '@community-marketplace/types';
import type {
  ConfirmAiCreditPackInput,
  ConfirmBoostInput,
  ConfirmEarlyCashbackUnlockInput,
  ConfirmFastTrackInput,
  ConfirmFeaturedInput,
  ConfirmFeaturedStoreInput,
  ConfirmGrowthPackInput,
  ConfirmStoreSlotInput,
  CreateAiCreditPackIntentInput,
  CreateBoostIntentInput,
  CreateEarlyCashbackUnlockIntentInput,
  CreateFeaturedIntentInput,
  CreateFeaturedStoreIntentInput,
  CreateFastTrackIntentInput,
  CreateStoreSlotIntentInput,
} from '@community-marketplace/validation';

import { computeFastTrackReviewDueAt } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import {
  FAST_TRACK_REQUEUE_APPLIED_KEY,
  FAST_TRACK_REQUEUE_METADATA_KEY,
  readFastTrackPurchaseMetadata,
} from '../lib/fast-track-purchase.lib';
import { EventBusService } from '../../../events/event-bus.service';
import { LoggerLib } from '../../../libs/logger.lib';
import { StripeConnectService } from '../../payments/services/stripe-connect.service';
import { VerificationService } from '../../verification/services/verification.service';
import {
  DEFAULT_PLATFORM_PRICING,
  roundMoney,
} from '../lib/boost.lib';
import {
  buildActiveFeaturedWhere,
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
import { FeaturedStoreCatalogService } from './featured-store-catalog.service';
import { FeaturedStoreFulfillmentService } from './featured-store-fulfillment.service';
import { GrowthPackFulfillmentService } from './growth-pack-fulfillment.service';
import { PlatformSettingsService } from './platform-settings.service';
import { StoreSlotCatalogService } from './store-slot-catalog.service';
import { StoreSlotFulfillmentService } from './store-slot-fulfillment.service';
import { PlatformPurchaseReceiptService } from './platform-purchase-receipt.service';
import { WalletSpendService } from './wallet-spend.service';
import { CashbackGrantsService } from './cashback-grants.service';
import { BuyerStatementPurchaseService } from '../../statements/services/buyer-statement-purchase.service';
import { slotsGrantedBySku, targetStoreSlotLimit } from '../lib/store-slot.lib';
import {
  AI_CREDIT_PACK_SKUS,
  aiCreditPackApproxUnits,
  aiCreditPackLabel,
  type AiCreditPackSku as AiCreditPackSkuLib,
} from '../lib/ai-credit-pack.lib';

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
    private readonly featuredStoreCatalog: FeaturedStoreCatalogService,
    private readonly featuredStoreFulfillment: FeaturedStoreFulfillmentService,
    private readonly fastTrackFulfillment: FastTrackFulfillmentService,
    private readonly storeSlotCatalog: StoreSlotCatalogService,
    private readonly storeSlotFulfillment: StoreSlotFulfillmentService,
    private readonly growthPackFulfillment: GrowthPackFulfillmentService,
    private readonly stripeConnect: StripeConnectService,
    private readonly purchaseReceipts: PlatformPurchaseReceiptService,
    private readonly walletSpend: WalletSpendService,
    private readonly cashbackGrants: CashbackGrantsService,
    @Inject(forwardRef(() => BuyerStatementPurchaseService))
    private readonly buyerStatementPurchases: BuyerStatementPurchaseService,
    private readonly eventBus: EventBusService,
    private readonly logger: LoggerLib,
    private readonly verification: VerificationService,
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
    const { amount, discountPercent, growthPackPurchaseId, discountKind } =
      await this.resolveBoostPrice(
        sellerId,
        dto.packageType,
        option.price,
        dto.source,
      );

    const mix = await this.resolveCreditsMix(sellerId, amount, dto.creditsAmount);

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
          basePrice: option.price,
          source: dto.source ?? 'listing_edit',
          discountPercent,
          discountKind,
          growthPackPurchaseId: growthPackPurchaseId ?? null,
          creditsApplied: mix.creditsApplied,
          amountChargedCard: mix.amountDue,
          paymentMix: mix.paymentMix,
          creditsDebited: false,
        },
      },
    });

    if (mix.amountDue <= 0) {
      return this.completeCreditsOnlyPurchase({
        purchaseId: purchase.id,
        sellerId,
        creditsApplied: mix.creditsApplied,
        fulfill: (id) => this.boostFulfillment.fulfillListingBoost(id),
        afterFulfill: async () => {
          if (growthPackPurchaseId) {
            await this.growthPackFulfillment.markBoostDiscountConsumed(
              growthPackPurchaseId,
            );
          }
        },
      });
    }

    const { providerPaymentId, clientSecret } = await this.createStripeIntent(
      mix.amountDue,
      settings.pricing.currency,
      {
        type: 'listing_boost',
        listingId: dto.listingId,
        userId: sellerId,
        packageType: dto.packageType,
        platformPurchaseId: purchase.id,
        source: dto.source ?? 'listing_edit',
        creditsApplied: String(mix.creditsApplied),
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
      creditsApplied: mix.creditsApplied,
      amountDue: mix.amountDue,
    };
  }

  async confirmBoost(sellerId: string, dto: ConfirmBoostInput): Promise<PlatformPurchase> {
    const purchase = await this.confirmPurchase(sellerId, dto.purchaseId, (id) =>
      this.boostFulfillment.fulfillListingBoost(id),
    );
    const metadata = (purchase as { metadata?: Record<string, unknown> }).metadata;
    // mapPlatformPurchase may strip metadata — reload
    const raw = await this.prisma.platformPurchase.findUnique({
      where: { id: dto.purchaseId },
    });
    const meta = (raw?.metadata ?? metadata ?? {}) as Record<string, unknown>;
    const growthPackPurchaseId =
      typeof meta.growthPackPurchaseId === 'string'
        ? meta.growthPackPurchaseId
        : null;
    if (growthPackPurchaseId) {
      await this.growthPackFulfillment.markBoostDiscountConsumed(
        growthPackPurchaseId,
      );
    }
    return purchase;
  }

  async getGrowthPackCatalog(sellerId: string): Promise<GrowthPackCatalogResponse> {
    const settings = await this.settings.get();
    const sku =
      settings.pricing.skus.seller_growth_pack ??
      DEFAULT_PLATFORM_PRICING.skus.seller_growth_pack!;
    const enabled = Boolean(sku.enabled);
    return {
      currency: settings.pricing.currency,
      option: {
        amount: sku.amount,
        walletCreditEur: sku.walletCreditEur,
        boostDiscountPercent: sku.boostDiscountPercent,
        enabled,
        eligible: enabled,
        reason: enabled ? undefined : 'growth_pack_disabled',
      },
    };
  }

  async createGrowthPackIntent(
    sellerId: string,
  ): Promise<GrowthPackIntentResponse> {
    await this.assertIntentRateLimit(sellerId, 'seller_growth_pack');
    const catalog = await this.getGrowthPackCatalog(sellerId);
    if (!catalog.option.eligible) {
      throw new BadRequestException(
        catalog.option.reason ?? 'Growth Pack is not available',
      );
    }

    const settings = await this.settings.get();
    const amount = roundMoney(catalog.option.amount);

    const purchase = await this.prisma.platformPurchase.create({
      data: {
        userId: sellerId,
        type: 'seller_growth_pack',
        status: 'pending',
        amount,
        currency: settings.pricing.currency.toUpperCase(),
        metadata: {
          sku: 'seller_growth_pack',
          walletCreditEur: catalog.option.walletCreditEur,
          boostDiscountPercent: catalog.option.boostDiscountPercent,
          boostDiscountConsumed: false,
          priceAtPurchase: amount,
        },
      },
    });

    const { providerPaymentId, clientSecret } = await this.createStripeIntent(
      amount,
      settings.pricing.currency,
      {
        type: 'seller_growth_pack',
        userId: sellerId,
        platformPurchaseId: purchase.id,
      },
      'growth_pack',
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

  async confirmGrowthPack(
    sellerId: string,
    dto: ConfirmGrowthPackInput,
  ): Promise<PlatformPurchase> {
    return this.confirmPurchase(sellerId, dto.purchaseId, (id) =>
      this.growthPackFulfillment.fulfillGrowthPack(id),
    );
  }

  async getAiCreditPackCatalog(
    _sellerId: string,
  ): Promise<AiCreditPackCatalogResponse> {
    const settings = await this.settings.get();
    const options = AI_CREDIT_PACK_SKUS.map((sku) => {
      const defaults = DEFAULT_PLATFORM_PRICING.skus[sku]!;
      const configured = settings.pricing.skus[sku] ?? defaults;
      const walletCreditEur = Number(
        configured.walletCreditEur ?? defaults.walletCreditEur,
      );
      const enabled = Boolean(configured.enabled);
      return {
        sku,
        label: aiCreditPackLabel(sku),
        amount: configured.amount,
        walletCreditEur,
        approxUnits: aiCreditPackApproxUnits(walletCreditEur),
        enabled,
        eligible: enabled,
        reason: enabled ? undefined : 'ai_credit_pack_disabled',
      };
    });
    return {
      currency: settings.pricing.currency,
      options,
    };
  }

  async createAiCreditPackIntent(
    sellerId: string,
    dto: CreateAiCreditPackIntentInput,
  ): Promise<AiCreditPackIntentResponse> {
    const sku = dto.sku as AiCreditPackSkuLib;
    await this.assertIntentRateLimit(sellerId, sku);
    const catalog = await this.getAiCreditPackCatalog(sellerId);
    const option = catalog.options.find((item) => item.sku === sku);
    if (!option?.eligible) {
      throw new BadRequestException(
        option?.reason ?? 'AI credit pack is not available',
      );
    }

    const settings = await this.settings.get();
    const amount = roundMoney(option.amount);

    const purchase = await this.prisma.platformPurchase.create({
      data: {
        userId: sellerId,
        type: sku,
        status: 'pending',
        amount,
        currency: settings.pricing.currency.toUpperCase(),
        metadata: {
          sku,
          walletCreditEur: option.walletCreditEur,
          approxUnits: option.approxUnits,
          priceAtPurchase: amount,
        },
      },
    });

    const { providerPaymentId, clientSecret } = await this.createStripeIntent(
      amount,
      settings.pricing.currency,
      {
        type: sku,
        userId: sellerId,
        platformPurchaseId: purchase.id,
      },
      'ai_credit',
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

  async confirmAiCreditPack(
    sellerId: string,
    dto: ConfirmAiCreditPackInput,
  ): Promise<PlatformPurchase> {
    return this.confirmPurchase(sellerId, dto.purchaseId, (id) =>
      this.growthPackFulfillment.fulfillAiCreditPack(id),
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
    const amount = roundMoney(option.price);

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

  async createFeaturedStoreIntent(
    sellerId: string,
    dto: CreateFeaturedStoreIntentInput,
  ): Promise<FeaturedStoreIntentResponse> {
    await this.assertIntentRateLimit(sellerId, 'featured_store');
    const catalog = await this.featuredStoreCatalog.getCatalog(
      sellerId,
      dto.storeId,
    );
    if (!catalog.option.eligible) {
      throw new BadRequestException(
        catalog.option.reason ?? 'This store is not eligible for featured placement',
      );
    }

    const settings = await this.settings.get();
    const amount = roundMoney(catalog.option.amount);

    const purchase = await this.prisma.platformPurchase.create({
      data: {
        userId: sellerId,
        type: 'featured_store',
        status: 'pending',
        amount,
        currency: settings.pricing.currency.toUpperCase(),
        metadata: {
          sku: 'featured_store_homepage',
          storeId: dto.storeId,
          placement: 'homepage',
          durationHours: catalog.option.durationHours,
          priceAtPurchase: amount,
        },
      },
    });

    const { providerPaymentId, clientSecret } = await this.createStripeIntent(
      amount,
      settings.pricing.currency,
      {
        type: 'featured_store',
        userId: sellerId,
        platformPurchaseId: purchase.id,
        storeId: dto.storeId,
      },
      'featured_store',
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

  async confirmFeaturedStore(
    sellerId: string,
    dto: ConfirmFeaturedStoreInput,
  ): Promise<PlatformPurchase> {
    return this.confirmPurchase(sellerId, dto.purchaseId, (id) =>
      this.featuredStoreFulfillment.fulfillFeaturedStore(id),
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
      select: { priority: true, slaDueAt: true },
    });

    const latestFastTrackPurchase = await this.prisma.platformPurchase.findFirst({
      where: {
        userId: sellerId,
        type: 'fast_track_verification',
        status: 'succeeded',
      },
      orderBy: { fulfilledAt: 'desc' },
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
      select: { sellerStatus: true, verificationRequestedAt: true },
    });

    const { eligible, reason, nextEligibleAt } = await this.evaluateFastTrackEligibility(
      sellerId,
      user.sellerStatus,
      enabled,
    );

    const hasPriority = pendingRequest?.priority ?? false;
    const purchaseMeta = latestFastTrackPurchase
      ? readFastTrackPurchaseMetadata(latestFastTrackPurchase.metadata)
      : {};
    const hasPriorityRequeue =
      purchaseMeta[FAST_TRACK_REQUEUE_METADATA_KEY] === true &&
      purchaseMeta[FAST_TRACK_REQUEUE_APPLIED_KEY] !== true;

    return {
      enabled,
      currency: settings.pricing.currency,
      price,
      eligible,
      reason,
      hasPriority,
      priorityReviewDueAt:
        pendingRequest?.slaDueAt?.toISOString() ??
        (hasPriority && user.verificationRequestedAt
          ? computeFastTrackReviewDueAt(user.verificationRequestedAt)
          : undefined),
      hasPriorityRequeue,
      pendingPurchase: pendingPurchase
        ? mapPlatformPurchase(pendingPurchase)
        : undefined,
      nextEligibleAt,
    };
  }

  async createFastTrackIntent(
    sellerId: string,
    dto: CreateFastTrackIntentInput = {},
  ): Promise<FastTrackIntentResponse> {
    await this.assertIntentRateLimit(sellerId, 'fast_track_verification');
    await this.verification.assertAcceleratedVerificationAllowed(sellerId);

    const status = await this.getFastTrackStatus(sellerId);
    if (!status.eligible) {
      throw new BadRequestException(status.reason ?? 'Fast-track verification is not available');
    }

    const settings = await this.settings.get();
    const amount = roundMoney(status.price);
    const mix = await this.resolveCreditsMix(sellerId, amount, dto.creditsAmount);

    const purchase = await this.prisma.platformPurchase.create({
      data: {
        userId: sellerId,
        type: 'fast_track_verification',
        status: 'pending',
        amount,
        currency: settings.pricing.currency.toUpperCase(),
        metadata: {
          priceAtPurchase: amount,
          creditsApplied: mix.creditsApplied,
          amountChargedCard: mix.amountDue,
          paymentMix: mix.paymentMix,
          creditsDebited: false,
        },
      },
    });

    if (mix.amountDue <= 0) {
      return this.completeCreditsOnlyPurchase({
        purchaseId: purchase.id,
        sellerId,
        creditsApplied: mix.creditsApplied,
        fulfill: (id) => this.fastTrackFulfillment.fulfillFastTrack(id),
      });
    }

    const { providerPaymentId, clientSecret } = await this.createStripeIntent(
      mix.amountDue,
      settings.pricing.currency,
      {
        type: 'fast_track_verification',
        userId: sellerId,
        platformPurchaseId: purchase.id,
        creditsApplied: String(mix.creditsApplied),
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
      creditsApplied: mix.creditsApplied,
      amountDue: mix.amountDue,
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

  async createEarlyCashbackUnlockIntent(
    buyerId: string,
    dto: CreateEarlyCashbackUnlockIntentInput,
  ): Promise<EarlyCashbackUnlockIntentResponse> {
    await this.assertIntentRateLimit(buyerId, 'early_cashback_unlock');

    const settings = await this.settings.get();
    const sku =
      settings.pricing.skus.early_cashback_unlock ??
      DEFAULT_PLATFORM_PRICING.skus.early_cashback_unlock!;
    if (!sku.enabled) {
      throw new BadRequestException('Early cashback unlock is not available');
    }

    const grant = await this.prisma.cashbackGrant.findFirst({
      where: { id: dto.grantId, userId: buyerId },
    });
    if (!grant) throw new NotFoundException('Cashback grant not found');
    if (grant.status !== 'pending') {
      throw new BadRequestException('Only pending cashback can be unlocked early');
    }
    if (grant.unlockAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'This cashback is already due to unlock — no early unlock needed',
      );
    }

    const existing = await this.prisma.platformPurchase.findFirst({
      where: {
        userId: buyerId,
        type: 'early_cashback_unlock',
        status: { in: ['pending', 'succeeded'] },
        metadata: { path: ['grantId'], equals: dto.grantId },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (existing?.status === 'succeeded') {
      throw new BadRequestException('This cashback was already unlocked early');
    }
    if (existing?.status === 'pending') {
      throw new BadRequestException(
        'An early unlock payment is already in progress for this cashback',
      );
    }

    const amount = roundMoney(Number(sku.amount));
    const mix = await this.resolveCreditsMix(buyerId, amount, dto.creditsAmount);

    const purchase = await this.prisma.platformPurchase.create({
      data: {
        userId: buyerId,
        type: 'early_cashback_unlock',
        status: 'pending',
        amount,
        currency: settings.pricing.currency.toUpperCase(),
        metadata: {
          grantId: dto.grantId,
          paymentId: grant.paymentId,
          grantAmount: Number(grant.amount),
          priceAtPurchase: amount,
          creditsApplied: mix.creditsApplied,
          amountChargedCard: mix.amountDue,
          paymentMix: mix.paymentMix,
          creditsDebited: false,
        },
      },
    });

    if (mix.amountDue <= 0) {
      const result = await this.completeCreditsOnlyPurchase({
        purchaseId: purchase.id,
        sellerId: buyerId,
        creditsApplied: mix.creditsApplied,
        fulfill: (id) => this.fulfillEarlyCashbackUnlock(id),
      });
      return { ...result, grantId: dto.grantId };
    }

    const { providerPaymentId, clientSecret } = await this.createStripeIntent(
      mix.amountDue,
      settings.pricing.currency,
      {
        type: 'early_cashback_unlock',
        userId: buyerId,
        platformPurchaseId: purchase.id,
        grantId: dto.grantId,
        creditsApplied: String(mix.creditsApplied),
      },
      'early_unlock',
    );

    const updated = await this.prisma.platformPurchase.update({
      where: { id: purchase.id },
      data: { providerPaymentId, clientSecret },
    });

    return {
      purchase: mapPlatformPurchase(updated),
      clientSecret,
      creditsApplied: mix.creditsApplied,
      amountDue: mix.amountDue,
      grantId: dto.grantId,
    };
  }

  async confirmEarlyCashbackUnlock(
    buyerId: string,
    dto: ConfirmEarlyCashbackUnlockInput,
  ): Promise<PlatformPurchase> {
    return this.confirmPurchase(buyerId, dto.purchaseId, (id) =>
      this.fulfillEarlyCashbackUnlock(id),
    );
  }

  async fulfillEarlyCashbackUnlock(purchaseId: string): Promise<boolean> {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase || purchase.type !== 'early_cashback_unlock') return false;
    if (purchase.status === 'succeeded' && purchase.fulfilledAt) return true;

    const meta = (purchase.metadata ?? {}) as Record<string, unknown>;
    const grantId = typeof meta.grantId === 'string' ? meta.grantId : null;
    if (!grantId) return false;

    const unlocked = await this.cashbackGrants.unlockGrantNow(purchase.userId, grantId);
    if (!unlocked) return false;

    await this.prisma.platformPurchase.update({
      where: { id: purchaseId },
      data: {
        status: 'succeeded',
        fulfilledAt: new Date(),
      },
    });
    return true;
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
        await this.debitCreditsForPurchaseIfNeeded(purchase.id);
        try {
          fulfilled = await this.boostFulfillment.fulfillListingBoost(purchase.id);
          if (!fulfilled) await this.refundCreditsForPurchaseIfNeeded(purchase.id);
        } catch (error) {
          await this.refundCreditsForPurchaseIfNeeded(purchase.id);
          throw error;
        }
        if (fulfilled) {
          const meta = (purchase.metadata ?? {}) as Record<string, unknown>;
          if (typeof meta.growthPackPurchaseId === 'string') {
            await this.growthPackFulfillment.markBoostDiscountConsumed(
              meta.growthPackPurchaseId,
            );
          }
        }
        break;
      case 'featured_slot':
        fulfilled = await this.featuredFulfillment.fulfillFeaturedSlot(purchase.id);
        break;
      case 'featured_store':
        fulfilled = await this.featuredStoreFulfillment.fulfillFeaturedStore(
          purchase.id,
        );
        break;
      case 'fast_track_verification':
        await this.debitCreditsForPurchaseIfNeeded(purchase.id);
        try {
          fulfilled = await this.fastTrackFulfillment.fulfillFastTrack(purchase.id);
          if (!fulfilled) await this.refundCreditsForPurchaseIfNeeded(purchase.id);
        } catch (error) {
          await this.refundCreditsForPurchaseIfNeeded(purchase.id);
          throw error;
        }
        break;
      case 'early_cashback_unlock':
        await this.debitCreditsForPurchaseIfNeeded(purchase.id);
        try {
          fulfilled = await this.fulfillEarlyCashbackUnlock(purchase.id);
          if (!fulfilled) await this.refundCreditsForPurchaseIfNeeded(purchase.id);
        } catch (error) {
          await this.refundCreditsForPurchaseIfNeeded(purchase.id);
          throw error;
        }
        break;
      case 'store_slot_2':
      case 'store_slot_3':
      case 'store_bundle_3':
        fulfilled = await this.storeSlotFulfillment.fulfillStoreSlot(purchase.id);
        break;
      case 'buyer_statement':
        await this.buyerStatementPurchases.fulfillFromWebhook(purchase.id);
        return true;
      case 'seller_growth_pack':
        fulfilled = await this.growthPackFulfillment.fulfillGrowthPack(
          purchase.id,
        );
        break;
      case 'ai_credit_2':
      case 'ai_credit_5':
      case 'ai_credit_10':
        fulfilled = await this.growthPackFulfillment.fulfillAiCreditPack(
          purchase.id,
        );
        break;
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
      | 'buyer_statement'
      | 'seller_growth_pack'
      | 'ai_credit_2'
      | 'ai_credit_5'
      | 'ai_credit_10'
      | 'featured_store';
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

    if (purchase.status === 'succeeded') {
      return mapPlatformPurchase(purchase);
    }

    const stripe = this.stripeConnect.getStripeClient();
    if (stripe && purchase.providerPaymentId) {
      const intent = await stripe.paymentIntents.retrieve(purchase.providerPaymentId);
      if (intent.status === 'succeeded') {
        await this.debitCreditsForPurchaseIfNeeded(purchase.id);
        try {
          await fulfill(purchase.id);
        } catch (error) {
          await this.refundCreditsForPurchaseIfNeeded(purchase.id);
          throw error;
        }
      } else if (intent.status === 'canceled') {
        await this.prisma.platformPurchase.update({
          where: { id: purchase.id },
          data: { status: 'failed' },
        });
      }
    } else if (purchase.providerPaymentId) {
      await this.debitCreditsForPurchaseIfNeeded(purchase.id);
      try {
        await fulfill(purchase.id);
      } catch (error) {
        await this.refundCreditsForPurchaseIfNeeded(purchase.id);
        throw error;
      }
    } else {
      // Credits-only purchases are fulfilled at intent time.
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

  private async resolveCreditsMix(
    userId: string,
    listPrice: number,
    creditsAmount?: number,
  ): Promise<{
    creditsApplied: number;
    amountDue: number;
    paymentMix: 'card' | 'credits' | 'hybrid';
  }> {
    const price = roundMoney(listPrice);
    const requested = roundMoney(Math.max(0, creditsAmount ?? 0));
    if (requested <= 0) {
      return { creditsApplied: 0, amountDue: price, paymentMix: 'card' };
    }

    const balance = await this.walletSpend.getBalance(userId);
    const creditsApplied = roundMoney(Math.min(requested, price, balance));
    const amountDue = roundMoney(price - creditsApplied);
    const paymentMix =
      creditsApplied <= 0 ? 'card' : amountDue <= 0 ? 'credits' : 'hybrid';
    return { creditsApplied, amountDue, paymentMix };
  }

  private async completeCreditsOnlyPurchase(input: {
    purchaseId: string;
    sellerId: string;
    creditsApplied: number;
    fulfill: (purchaseId: string) => Promise<boolean>;
    afterFulfill?: () => Promise<void>;
  }): Promise<{
    purchase: PlatformPurchase;
    clientSecret: null;
    creditsApplied: number;
    amountDue: number;
  }> {
    if (input.creditsApplied > 0) {
      await this.walletSpend.debitForPlatformPurchase({
        userId: input.sellerId,
        amount: input.creditsApplied,
        purchaseId: input.purchaseId,
      });
    }

    const existing = await this.prisma.platformPurchase.findUniqueOrThrow({
      where: { id: input.purchaseId },
    });
    const meta = {
      ...((existing.metadata ?? {}) as Record<string, unknown>),
      creditsDebited: true,
      amountChargedCard: 0,
      paymentMix: 'credits',
    };
    await this.prisma.platformPurchase.update({
      where: { id: input.purchaseId },
      data: { metadata: meta as object },
    });

    try {
      const ok = await input.fulfill(input.purchaseId);
      if (!ok) {
        await this.refundCreditsForPurchaseIfNeeded(input.purchaseId);
        throw new BadRequestException('Could not complete purchase with credits');
      }
    } catch (error) {
      await this.refundCreditsForPurchaseIfNeeded(input.purchaseId);
      throw error;
    }

    if (input.afterFulfill) await input.afterFulfill();
    await this.afterPurchaseSucceeded(input.purchaseId);

    const row = await this.prisma.platformPurchase.findUniqueOrThrow({
      where: { id: input.purchaseId },
    });
    return {
      purchase: mapPlatformPurchase(row),
      clientSecret: null,
      creditsApplied: input.creditsApplied,
      amountDue: 0,
    };
  }

  private async debitCreditsForPurchaseIfNeeded(purchaseId: string): Promise<void> {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) return;

    const meta = (purchase.metadata ?? {}) as Record<string, unknown>;
    if (meta.creditsDebited === true) return;
    const creditsApplied = Number(meta.creditsApplied ?? 0);
    if (!(creditsApplied > 0)) return;

    await this.walletSpend.debitForPlatformPurchase({
      userId: purchase.userId,
      amount: creditsApplied,
      purchaseId: purchase.id,
    });

    await this.prisma.platformPurchase.update({
      where: { id: purchase.id },
      data: {
        metadata: {
          ...meta,
          creditsDebited: true,
        } as object,
      },
    });
  }

  /** Reverse a prior debit if fulfillment failed after credits were taken. */
  private async refundCreditsForPurchaseIfNeeded(purchaseId: string): Promise<void> {
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: purchaseId },
    });
    if (!purchase) return;

    const meta = (purchase.metadata ?? {}) as Record<string, unknown>;
    if (meta.creditsDebited !== true || meta.creditsRefunded === true) return;
    const creditsApplied = Number(meta.creditsApplied ?? 0);
    if (!(creditsApplied > 0)) return;

    await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.buyerWallet.findUnique({
        where: { userId: purchase.userId },
      });
      const balance = wallet ? Number(wallet.balance) : 0;
      const nextBalance = roundMoney(balance + creditsApplied);
      await tx.buyerWallet.upsert({
        where: { userId: purchase.userId },
        create: { userId: purchase.userId, balance: nextBalance },
        update: { balance: nextBalance },
      });
      await tx.walletTransaction.create({
        data: {
          userId: purchase.userId,
          type: 'credit_topup',
          amount: creditsApplied,
        },
      });
      await tx.platformPurchase.update({
        where: { id: purchase.id },
        data: {
          metadata: {
            ...meta,
            creditsDebited: false,
            creditsRefunded: true,
          } as object,
        },
      });
    });
  }

  private async assertIntentRateLimit(
    sellerId: string,
    type:
      | 'listing_boost'
      | 'featured_slot'
      | 'fast_track_verification'
      | 'early_cashback_unlock'
      | 'store_slot_2'
      | 'store_slot_3'
      | 'store_bundle_3'
      | 'seller_growth_pack'
      | 'ai_credit_2'
      | 'ai_credit_5'
      | 'ai_credit_10'
      | 'featured_store',
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
    source?: CreateBoostIntentInput['source'],
  ): Promise<{
    amount: number;
    discountPercent: number;
    discountKind: 'none' | 'first_boost' | 'growth_pack';
    growthPackPurchaseId?: string;
  }> {
    const settings = await this.settings.get();

    if (source === 'marketing_hub') {
      const unusedGrowthPack = await this.prisma.platformPurchase.findFirst({
        where: {
          userId: sellerId,
          type: 'seller_growth_pack',
          status: 'succeeded',
        },
        orderBy: { fulfilledAt: 'asc' },
      });
      if (unusedGrowthPack) {
        const meta = (unusedGrowthPack.metadata ?? {}) as Record<string, unknown>;
        if (meta.boostDiscountConsumed !== true) {
          const discountPercent = Number(meta.boostDiscountPercent ?? 0);
          if (discountPercent > 0) {
            return {
              amount: roundMoney(basePrice * (1 - discountPercent / 100)),
              discountPercent,
              discountKind: 'growth_pack',
              growthPackPurchaseId: unusedGrowthPack.id,
            };
          }
        }
      }
    }

    const discountPercent = settings.pricing.promos?.first_boost_discount_percent ?? 0;
    if (discountPercent <= 0) {
      return {
        amount: roundMoney(basePrice),
        discountPercent: 0,
        discountKind: 'none',
      };
    }

    const priorSuccess = await this.prisma.platformPurchase.count({
      where: {
        userId: sellerId,
        type: 'listing_boost',
        status: 'succeeded',
      },
    });
    if (priorSuccess > 0) {
      return {
        amount: roundMoney(basePrice),
        discountPercent: 0,
        discountKind: 'none',
      };
    }

    return {
      amount: roundMoney(basePrice * (1 - discountPercent / 100)),
      discountPercent,
      discountKind: 'first_boost',
    };
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

    const personalDetails = await this.verification.getPersonalDetailsSnapshot(sellerId);
    if (!personalDetails.complete) {
      return { eligible: false, reason: 'personal_details_incomplete' };
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
