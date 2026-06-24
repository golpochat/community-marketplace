import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { PaymentDispute } from '@community-marketplace/types';
import type { DisputeEvidenceInput } from '@community-marketplace/validation';

import { EventBusService } from '../../../events/event-bus.service';
import { PrismaService } from '../../../database/prisma.service';
import { mapDispute } from '../mappers/payment.mapper';
import { PaymentsAuditService } from './payments-audit.service';

@Injectable()
export class PaymentsDisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: PaymentsAuditService,
    private readonly eventBus: EventBusService,
  ) {}

  async upsertFromWebhook(
    paymentId: string,
    providerDisputeId: string,
    reason?: string,
  ): Promise<PaymentDispute> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment) throw new NotFoundException('Payment not found for dispute');

    const row = await this.prisma.paymentDispute.upsert({
      where: { providerDisputeId },
      create: {
        paymentId,
        providerDisputeId,
        status: 'open',
        reason,
      },
      update: { reason },
    });

    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'disputed' },
    });

    await this.audit.record('payment_disputed', undefined, paymentId, {
      providerDisputeId,
    });

    this.eventBus.publish({
      type: 'payment.disputed',
      payload: {
        paymentId,
        disputeId: row.id,
        sellerId: payment.sellerId,
        listingId: payment.listingId,
      },
      timestamp: new Date(),
    });

    return mapDispute(row);
  }

  async addEvidence(
    adminId: string,
    dto: DisputeEvidenceInput,
  ): Promise<PaymentDispute> {
    const dispute = await this.prisma.paymentDispute.findUnique({
      where: { id: dto.disputeId },
    });
    if (!dispute) throw new NotFoundException('Dispute not found');
    if (dispute.status === 'won' || dispute.status === 'lost' || dispute.status === 'closed') {
      throw new BadRequestException('Dispute is already closed');
    }

    const existingEvidence =
      (dispute.evidence as Record<string, unknown> | null) ?? {};
    const merged = { ...existingEvidence, ...dto.evidence, uploadedBy: adminId };

    const row = await this.prisma.paymentDispute.update({
      where: { id: dispute.id },
      data: {
        evidence: merged as Prisma.InputJsonValue,
        status: 'under_review',
      },
    });

    await this.audit.record('payment_disputed', adminId, dispute.paymentId, {
      disputeId: dispute.id,
      action: 'evidence_uploaded',
    });

    return mapDispute(row);
  }

  async list(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.paymentDispute.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.paymentDispute.count(),
    ]);

    return {
      data: rows.map(mapDispute),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<PaymentDispute> {
    const row = await this.prisma.paymentDispute.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Dispute not found');
    return mapDispute(row);
  }
}
