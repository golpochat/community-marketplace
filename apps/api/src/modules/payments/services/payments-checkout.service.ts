import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { CheckoutSessionResponse } from '@community-marketplace/types';
import type { CreateCheckoutSessionInput } from '@community-marketplace/validation';

import { EventBusService } from '../../../events/event-bus.service';
import { PrismaService } from '../../../database/prisma.service';
import { LoggerLib } from '../../../libs/logger.lib';
import { mapPayment } from '../mappers/payment.mapper';
import { PlatformFeeService } from '../../monetization/services/platform-fee.service';
import { buildCheckoutPaymentIntentData } from '../lib/stripe-charge.lib';
import { PaymentsAuditService } from './payments-audit.service';
import { PaymentsFraudService } from './payments-fraud.service';
import { StripeConnectService } from './stripe-connect.service';

@Injectable()
export class PaymentsCheckoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeConnect: StripeConnectService,
    private readonly fraud: PaymentsFraudService,
    private readonly audit: PaymentsAuditService,
    private readonly eventBus: EventBusService,
    private readonly platformFee: PlatformFeeService,
    private readonly logger: LoggerLib,
  ) {}

  async createCheckoutSession(
    buyerId: string,
    dto: CreateCheckoutSessionInput,
  ): Promise<CheckoutSessionResponse> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: {
        id: true,
        title: true,
        sellerId: true,
        price: true,
        currency: true,
        status: true,
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.status !== 'active') {
      throw new BadRequestException('Listing is not available for purchase');
    }

    await this.fraud.validatePurchase(buyerId, dto.listingId, listing.sellerId);
    const connectAccount = await this.stripeConnect.assertSellerCanReceivePayments(
      listing.sellerId,
    );

    const amount = Number(listing.price);
    const currency = listing.currency.toUpperCase();
    const { feePercent, platformFee } = await this.platformFee.calculatePlatformFee(
      amount,
      listing.sellerId,
    );
    const amountCents = Math.round(amount * 100);
    const platformFeeCents = Math.round(platformFee * 100);
    const webAppUrl = process.env.WEB_APP_URL ?? 'http://localhost:3000';
    const successUrl =
      dto.successUrl ??
      `${webAppUrl}/buyer/purchases?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = dto.cancelUrl ?? `${webAppUrl}/buyer/purchases?checkout=cancelled`;

    const row = await this.prisma.payment.create({
      data: {
        listingId: listing.id,
        buyerId,
        sellerId: listing.sellerId,
        amount,
        platformFee,
        feePercentApplied: feePercent,
        currency,
        method: 'card',
        status: 'pending',
      },
    });

    const stripe = this.stripeConnect.getStripeClient();
    let sessionId: string;
    let checkoutUrl: string;
    let providerPaymentId: string | undefined;

    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          line_items: [
            {
              price_data: {
                currency: currency.toLowerCase(),
                unit_amount: amountCents,
                product_data: { name: listing.title },
              },
              quantity: 1,
            },
          ],
          payment_intent_data: buildCheckoutPaymentIntentData({
            amountCents,
            currency,
            platformFeeCents,
            connectAccountId: connectAccount.stripeAccountId,
            metadata: {
              listingId: listing.id,
              buyerId,
              sellerId: listing.sellerId,
              paymentId: row.id,
            },
          }),
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            paymentId: row.id,
            listingId: listing.id,
            buyerId,
            sellerId: listing.sellerId,
          },
        });
        sessionId = session.id;
        checkoutUrl = session.url ?? '';
        providerPaymentId =
          typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id;

        this.logger.log('PaymentsCheckoutService', 'checkout.session.created', {
          sessionId,
          paymentId: row.id,
          listingId: listing.id,
        });
      } catch (error) {
        await this.prisma.payment.delete({ where: { id: row.id } });
        throw error;
      }
    } else {
      sessionId = `cs_dev_${Date.now()}`;
      checkoutUrl = `${webAppUrl}/buyer/purchases?checkout=dev&payment_id=${row.id}`;
      providerPaymentId = `pi_dev_${Date.now()}`;
    }

    const updated = await this.prisma.payment.update({
      where: { id: row.id },
      data: {
        providerPaymentId,
        clientSecret: sessionId,
      },
    });

    await this.audit.record('payment_created', buyerId, row.id, {
      listingId: listing.id,
      amount,
      checkoutSessionId: sessionId,
      flow: 'checkout_session',
    });

    this.eventBus.publish({
      type: 'payment.created',
      payload: { paymentId: row.id, listingId: listing.id, buyerId },
      timestamp: new Date(),
    });

    return {
      payment: mapPayment(updated),
      sessionId,
      checkoutUrl,
    };
  }
}
