import { Injectable, NotFoundException } from '@nestjs/common';

import type { Payment } from '@community-marketplace/types';
import type { PaymentAdminFiltersInput } from '../dto/payments.dto';

import { PrismaService } from '../../../database/prisma.service';
import { mapPayment, paymentInclude } from '../mappers/payment.mapper';

@Injectable()
export class PaymentsCrudService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Payment> {
    const row = await this.prisma.payment.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Payment ${id} not found`);
    return mapPayment(row);
  }

  async findByProviderPaymentId(providerPaymentId: string) {
    return this.prisma.payment.findFirst({
      where: { providerPaymentId },
    });
  }

  async findByUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { OR: [{ buyerId: userId }, { sellerId: userId }] };
    const [rows, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: rows.map(mapPayment),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findBuyerHistory(buyerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = { buyerId };
    const [rows, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: paymentInclude,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: rows.map(mapPayment),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async adminList(filters: PaymentAdminFiltersInput) {
    const { page, limit, status, buyerId, sellerId, listingId } = filters;
    const skip = (page - 1) * limit;
    const where = {
      ...(status ? { status } : {}),
      ...(buyerId ? { buyerId } : {}),
      ...(sellerId ? { sellerId } : {}),
      ...(listingId ? { listingId } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: paymentInclude,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: rows.map(mapPayment),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
