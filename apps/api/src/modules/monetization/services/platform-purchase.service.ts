import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  BoostIntentResponse,
  BoostPackageType,
  PlatformPurchase,
} from '@community-marketplace/types';
import type {
  ConfirmBoostInput,
  CreateBoostIntentInput,
} from '@community-marketplace/validation';

import { PrismaService } from '../../../database/prisma.service';
import { StripeConnectService } from '../../payments/services/stripe-connect.service';
import {
  boostSkuKey,
  roundMoney,
} from '../lib/boost.lib';
import { mapPlatformPurchase } from '../mappers/monetization.mapper';
import { BoostCatalogService } from './boost-catalog.service';
import { BoostFulfillmentService } from './boost-fulfillment.service';
import { PlatformSettingsService } from './platform-settings.service';

const DAILY_INTENT_LIMIT = 10;

@Injectable()
export class PlatformPurchaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: PlatformSettingsService,
    private readonly catalog: BoostCatalogService,
    private readonly fulfillment: BoostFulfillmentService,
    private readonly stripeConnect: StripeConnectService,
  ) {}

  async createBoostIntent(
    sellerId: string,
    dto: CreateBoostIntentInput,
  ): Promise<BoostIntentResponse> {
    await this.assertIntentRateLimit(sellerId);

    const catalog = await this.catalog.getCatalog(sellerId, dto.listingId);
    const option = catalog.options.find((item) => item.packageType === dto.packageType);
    if (!option?.eligible) {
      throw new BadRequestException(
        option?.reason ?? 'This listing is not eligible for a boost',
      );
    }

    const settings = await this.settings.get();
    const amount = await this.resolveBoostPrice(sellerId, dto.packageType, settings.pricing.skus[
      boostSkuKey(dto.packageType)
    ].amount);

    const stripe = this.stripeConnect.getStripeClient();
    const currency = settings.pricing.currency.toLowerCase();

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

    let providerPaymentId: string;
    let clientSecret: string;

    if (stripe) {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency,
        metadata: {
          type: 'listing_boost',
          listingId: dto.listingId,
          userId: sellerId,
          packageType: dto.packageType,
          platformPurchaseId: purchase.id,
        },
      });
      providerPaymentId = intent.id;
      clientSecret = intent.client_secret ?? '';
    } else {
      providerPaymentId = `pi_dev_boost_${Date.now()}`;
      clientSecret = `pi_dev_boost_secret_${Date.now()}`;
    }

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
    const purchase = await this.prisma.platformPurchase.findUnique({
      where: { id: dto.purchaseId },
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    if (purchase.userId !== sellerId) {
      throw new ForbiddenException('You can only confirm your own purchases');
    }

    const stripe = this.stripeConnect.getStripeClient();
    if (stripe && purchase.providerPaymentId) {
      const intent = await stripe.paymentIntents.retrieve(purchase.providerPaymentId);
      if (intent.status === 'succeeded') {
        await this.fulfillment.fulfillListingBoost(purchase.id);
      } else if (intent.status === 'canceled') {
        await this.prisma.platformPurchase.update({
          where: { id: purchase.id },
          data: { status: 'failed' },
        });
      }
    } else {
      await this.fulfillment.fulfillListingBoost(purchase.id);
    }

    const row = await this.prisma.platformPurchase.findUniqueOrThrow({
      where: { id: purchase.id },
    });
    return mapPlatformPurchase(row);
  }

  async handlePaymentIntentSucceeded(providerPaymentId: string): Promise<boolean> {
    const purchase = await this.prisma.platformPurchase.findFirst({
      where: { providerPaymentId },
    });
    if (!purchase) return false;
    return this.fulfillment.fulfillListingBoost(purchase.id);
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
    type?: 'listing_boost';
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

  private async assertIntentRateLimit(sellerId: string) {
    const since = new Date();
    since.setHours(since.getHours() - 24);
    const count = await this.prisma.platformPurchase.count({
      where: {
        userId: sellerId,
        type: 'listing_boost',
        createdAt: { gte: since },
      },
    });
    if (count >= DAILY_INTENT_LIMIT) {
      throw new HttpException('Boost purchase limit reached for today', HttpStatus.TOO_MANY_REQUESTS);
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
}
