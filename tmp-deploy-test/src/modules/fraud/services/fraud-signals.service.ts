import { Injectable } from '@nestjs/common';
import type { FraudSignalType } from '@prisma/client';

import type { FraudSignalType as FraudSignalTypeDto } from '@community-marketplace/types';

import { PrismaService } from '../../../database/prisma.service';
import { FRAUD_SIGNAL_WEIGHTS } from '../mappers/fraud.mapper';

const SIGNAL_WINDOW_DAYS = 30;

@Injectable()
export class FraudSignalsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordSignal(input: {
    userId: string;
    listingId?: string;
    signalType: FraudSignalTypeDto;
    signalValue: string;
    riskScore?: number;
  }) {
    const since = this.windowStart();
    const existing = await this.prisma.fraudSignal.findFirst({
      where: {
        userId: input.userId,
        listingId: input.listingId ?? null,
        signalType: input.signalType as FraudSignalType,
        signalValue: input.signalValue,
        dismissedAt: null,
        createdAt: { gte: since },
      },
    });
    if (existing) {
      return existing;
    }

    const riskScore = input.riskScore ?? FRAUD_SIGNAL_WEIGHTS[input.signalType];

    const signal = await this.prisma.fraudSignal.create({
      data: {
        userId: input.userId,
        listingId: input.listingId,
        signalType: input.signalType as FraudSignalType,
        signalValue: input.signalValue,
        riskScore,
      },
    });

    return signal;
  }

  async getActiveSignalsForUser(userId: string) {
    return this.prisma.fraudSignal.findMany({
      where: {
        userId,
        dismissedAt: null,
        createdAt: { gte: this.windowStart() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveSignalsForListing(listingId: string) {
    return this.prisma.fraudSignal.findMany({
      where: {
        listingId,
        dismissedAt: null,
        createdAt: { gte: this.windowStart() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async computeUserRiskScore(userId: string): Promise<number> {
    const signals = await this.getActiveSignalsForUser(userId);
    return Math.min(100, signals.reduce((sum, s) => sum + s.riskScore, 0));
  }

  async computeListingRiskScore(listingId: string): Promise<number> {
    const signals = await this.getActiveSignalsForListing(listingId);
    return Math.min(100, signals.reduce((sum, s) => sum + s.riskScore, 0));
  }

  private windowStart(): Date {
    const since = new Date();
    since.setDate(since.getDate() - SIGNAL_WINDOW_DAYS);
    return since;
  }
}
