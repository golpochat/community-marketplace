import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import type { LedgerEntryType } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { mapLedgerEntry } from '../mappers/payment.mapper';

@Injectable()
export class PaymentsLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    userId: string,
    type: LedgerEntryType,
    amount: number,
    currency: string,
    options?: {
      paymentId?: string;
      referenceId?: string;
      metadata?: Record<string, unknown>;
    },
  ) {
    const row = await this.prisma.ledgerEntry.create({
      data: {
        userId,
        type,
        amount,
        currency,
        paymentId: options?.paymentId,
        referenceId: options?.referenceId,
        metadata: options?.metadata as Prisma.InputJsonValue | undefined,
      },
    });
    return mapLedgerEntry(row);
  }

  async listForUser(userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ledgerEntry.count({ where: { userId } }),
    ]);

    return {
      data: rows.map(mapLedgerEntry),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async listAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ledgerEntry.count(),
    ]);

    return {
      data: rows.map(mapLedgerEntry),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
