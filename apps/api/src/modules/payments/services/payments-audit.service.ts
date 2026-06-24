import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { PaymentAuditEventType } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class PaymentsAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    eventType: PaymentAuditEventType,
    actorId?: string,
    paymentId?: string,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.paymentAuditLog.create({
      data: {
        eventType,
        actorId,
        paymentId,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
