import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { RbacRole } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class PaymentsAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanViewPayment(
    paymentId: string,
    userId: string,
    role: RbacRole,
  ) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException(`Payment ${paymentId} not found`);

    const isParticipant =
      payment.buyerId === userId || payment.sellerId === userId;
    const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

    if (!isParticipant && !isAdmin) {
      throw new ForbiddenException('You cannot access this payment');
    }

    return payment;
  }

  assertBuyerRole(role: RbacRole) {
    if (role !== 'BUYER') {
      throw new ForbiddenException('Only buyers can initiate payments');
    }
  }

  assertSellerRole(role: RbacRole) {
    if (role !== 'SELLER') {
      throw new ForbiddenException('Only sellers can access seller payment features');
    }
  }
}
