import { Injectable, NotFoundException } from '@nestjs/common';

import type { Payment } from '@community-marketplace/types';

import { EventBusService } from '../../events/event-bus.service';
import { PaymentEntity } from './entities/payment.entity';
import type { CreatePaymentDto } from './dto/payments.dto';
import { StripeConnectService } from './services/stripe-connect.service';

@Injectable()
export class PaymentsService {
  private readonly payments = new Map<string, PaymentEntity>();

  constructor(
    private readonly stripeConnectService: StripeConnectService,
    private readonly eventBus: EventBusService,
  ) {}

  async create(buyerId: string, sellerId: string, dto: CreatePaymentDto): Promise<Payment> {
    const connectAccount = this.stripeConnectService.getAccount(sellerId);
    const intent = await this.stripeConnectService.createPaymentIntent(
      dto.amount,
      dto.currency,
      connectAccount?.stripeAccountId,
    );

    const payment = new PaymentEntity();
    payment.id = `pay-${Date.now()}`;
    payment.buyerId = buyerId;
    payment.sellerId = sellerId;
    payment.listingId = dto.listingId;
    payment.amount = dto.amount;
    payment.currency = dto.currency.toUpperCase();
    payment.method = dto.method;
    payment.status = 'pending';
    payment.stripePaymentIntentId = intent.paymentIntentId;
    payment.transactionRef = intent.clientSecret;
    payment.createdAt = new Date();
    payment.updatedAt = new Date();

    this.payments.set(payment.id, payment);

    this.eventBus.publish({
      type: 'payment.created',
      payload: { paymentId: payment.id, listingId: dto.listingId },
      timestamp: new Date(),
    });

    return this.toPayment(payment);
  }

  findById(id: string): Payment {
    const payment = this.payments.get(id);
    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
    return this.toPayment(payment);
  }

  findByUser(userId: string): Payment[] {
    return [...this.payments.values()]
      .filter((p) => p.buyerId === userId || p.sellerId === userId)
      .map((p) => this.toPayment(p));
  }

  markCompleted(id: string): Payment {
    const payment = this.payments.get(id);
    if (!payment) {
      throw new NotFoundException(`Payment ${id} not found`);
    }
    payment.status = 'completed';
    payment.updatedAt = new Date();
    return this.toPayment(payment);
  }

  private toPayment(entity: PaymentEntity): Payment {
    return {
      id: entity.id,
      buyerId: entity.buyerId,
      sellerId: entity.sellerId,
      listingId: entity.listingId,
      amount: entity.amount,
      currency: entity.currency,
      method: entity.method,
      status: entity.status,
      transactionRef: entity.transactionRef,
      createdAt: entity.createdAt.toISOString(),
      updatedAt: entity.updatedAt.toISOString(),
    };
  }
}
