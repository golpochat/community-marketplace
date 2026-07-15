import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, SellerStatus } from '@prisma/client';

import type { RbacRole, SellerStatusHistoryEntry } from '@community-marketplace/types';
import { canEnterSellerNamespace } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';

type HistoryClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class SellerStatusHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async logChange(
    input: {
      userId: string;
      oldStatus: SellerStatus;
      newStatus: SellerStatus;
      changedBy?: string | null;
      reason?: string | null;
    },
    client: HistoryClient = this.prisma,
  ) {
    return client.sellerStatusHistory.create({
      data: {
        userId: input.userId,
        oldStatus: input.oldStatus,
        newStatus: input.newStatus,
        changedBy: input.changedBy ?? null,
        reason: input.reason ?? null,
      },
    });
  }

  async getHistory(userId: string, page = 1, limit = 50) {
    const seller = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, primaryRole: { select: { code: true } } },
    });
    if (!seller || !canEnterSellerNamespace(seller.primaryRole.code as RbacRole)) {
      throw new NotFoundException('Seller not found');
    }

    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      this.prisma.sellerStatusHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          actor: { select: { id: true, displayName: true, email: true } },
        },
      }),
      this.prisma.sellerStatusHistory.count({ where: { userId } }),
    ]);

    return {
      data: rows.map((row) => this.mapEntry(row)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  mapEntry(
    row: Prisma.SellerStatusHistoryGetPayload<{
      include: { actor: { select: { id: true; displayName: true; email: true } } };
    }>,
  ): SellerStatusHistoryEntry {
    return {
      id: row.id,
      userId: row.userId,
      oldStatus: row.oldStatus,
      newStatus: row.newStatus,
      changedBy: row.changedBy ?? undefined,
      changedByName: this.resolveActorLabel(row),
      reason: row.reason ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private resolveActorLabel(
    row: Prisma.SellerStatusHistoryGetPayload<{
      include: { actor: { select: { id: true; displayName: true; email: true } } };
    }>,
  ): string {
    if (!row.changedBy) return 'System';
    if (row.changedBy === row.userId) return 'Seller';
    return row.actor?.displayName ?? row.actor?.email ?? row.changedBy;
  }
}
