import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  Payment,
  PaymentIntentResponse,
} from '@community-marketplace/types';
import type {
  ConfirmPaymentInput,
  CreatePaymentIntentInput,
} from '@community-marketplace/validation';

import { EventBusService } from '../../../events/event-bus.service';
import { PrismaService } from '../../../database/prisma.service';
import {
  calculatePlatformFee,
  mapPayment,
} from '../mappers/payment.mapper';
import { PaymentsAuditService } from './payments-audit.service';
import { PaymentCompletionService } from './payment-completion.service';
import { PaymentsFraudService } from './payments-fraud.service';
import { StripeConnectService } from './stripe-connect.service';

@Injectable()
export class PaymentsIntentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeConnect: StripeConnectService,
    private readonly fraud: PaymentsFraudService,
    private readonly audit: PaymentsAuditService,
    private readonly completion: PaymentCompletionService,
    private readonly eventBus: EventBusService,
  ) {}

  async createPaymentIntent(
    buyerId: string,
    dto: CreatePaymentIntentInput,
  ): Promise<PaymentIntentResponse> {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      select: { id: true, sellerId: true, price: true, currency: true, status: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');

    await this.fraud.validatePurchase(buyerId, dto.listingId, listing.sellerId);
    const connectAccount = await this.stripeConnect.assertSellerCanReceivePayments(
      listing.sellerId,
    );

    const amount = Number(listing.price);
    const currency = listing.currency.toUpperCase();
    const platformFee = calculatePlatformFee(amount);
    const stripe = this.stripeConnect.getStripeClient();

    let providerPaymentId: string;
    let clientSecret: string;

    if (stripe) {
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        application_fee_amount: Math.round(platformFee * 100),
        transfer_data: { destination: connectAccount.stripeAccountId },
        metadata: {
          listingId: listing.id,
          buyerId,
          sellerId: listing.sellerId,
        },
      });
      providerPaymentId = intent.id;
      clientSecret = intent.client_secret ?? '';
    } else {
      providerPaymentId = `pi_dev_${Date.now()}`;
      clientSecret = `pi_dev_secret_${Date.now()}`;
    }

    const row = await this.prisma.payment.create({
      data: {
        listingId: listing.id,
        buyerId,
        sellerId: listing.sellerId,
        amount,
        platformFee,
        currency,
        method: dto.method,
        status: 'pending',
        providerPaymentId,
        clientSecret,
      },
    });

    await this.audit.record('payment_created', buyerId, row.id, {
      listingId: listing.id,
      amount,
    });

    this.eventBus.publish({
      type: 'payment.created',
      payload: { paymentId: row.id, listingId: listing.id, buyerId },
      timestamp: new Date(),
    });

    const payment = mapPayment(row);
    return { payment, clientSecret };
  }

  async confirmPayment(
    buyerId: string,
    dto: ConfirmPaymentInput,
  ): Promise<Payment> {
    const row = await this.prisma.payment.findUnique({
      where: { id: dto.paymentId },
    });
    if (!row) throw new NotFoundException('Payment not found');
    if (row.buyerId !== buyerId) {
      throw new BadRequestException('You can only confirm your own payments');
    }
    if (row.status !== 'pending' && row.status !== 'processing') {
      throw new BadRequestException(`Payment cannot be confirmed in status ${row.status}`);
    }

    const stripe = this.stripeConnect.getStripeClient();
    if (stripe && row.providerPaymentId) {
      const intent = await stripe.paymentIntents.retrieve(row.providerPaymentId);
      const status =
        intent.status === 'succeeded'
          ? 'succeeded'
          : intent.status === 'processing'
            ? 'processing'
            : intent.status === 'canceled'
              ? 'failed'
              : 'pending';

      if (status === 'succeeded') {
        await this.audit.record('payment_confirmed', buyerId, row.id, {
          stripeStatus: intent.status,
        });
        await this.completion.finalizeSuccessfulPayment(row.id, intent.id);
        const finalized = await this.prisma.payment.findUnique({ where: { id: row.id } });
        return mapPayment(finalized!);
      }

      const updated = await this.prisma.payment.update({
        where: { id: row.id },
        data: { status },
      });

      await this.audit.record('payment_confirmed', buyerId, row.id, {
        stripeStatus: intent.status,
      });

      return mapPayment(updated);
    }

    await this.audit.record('payment_confirmed', buyerId, row.id);
    await this.completion.finalizeSuccessfulPayment(row.id);
    const finalized = await this.prisma.payment.findUnique({ where: { id: row.id } });
    return mapPayment(finalized!);
  }
}
