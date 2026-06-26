import type {
  FraudRiskBreakdownItem,
  FraudSignal,
  FraudSignalType,
  HighRiskListingSummary,
  HighRiskUserSummary,
} from '@community-marketplace/types';
import {
  FRAUD_SIGNAL_LABELS,
  FRAUD_SIGNAL_WEIGHTS,
  fraudRiskLevel,
} from '@community-marketplace/types';
import type { FraudSignal as PrismaFraudSignal } from '@prisma/client';

export function mapFraudSignal(row: PrismaFraudSignal): FraudSignal {
  return {
    id: row.id,
    userId: row.userId,
    listingId: row.listingId ?? undefined,
    signalType: row.signalType as FraudSignalType,
    signalValue: row.signalValue,
    riskScore: row.riskScore,
    dismissedAt: row.dismissedAt?.toISOString(),
    escalatedAt: row.escalatedAt?.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

export function buildRiskBreakdown(
  signals: Array<{ signalType: FraudSignalType; riskScore: number }>,
): FraudRiskBreakdownItem[] {
  const map = new Map<FraudSignalType, { count: number; totalScore: number }>();

  for (const signal of signals) {
    const current = map.get(signal.signalType) ?? { count: 0, totalScore: 0 };
    map.set(signal.signalType, {
      count: current.count + 1,
      totalScore: current.totalScore + signal.riskScore,
    });
  }

  return [...map.entries()]
    .map(([signalType, stats]) => ({
      signalType,
      label: FRAUD_SIGNAL_LABELS[signalType],
      count: stats.count,
      totalScore: stats.totalScore,
    }))
    .sort((a, b) => b.totalScore - a.totalScore);
}

export function aggregateRiskScore(
  signals: Array<{ riskScore: number }>,
): number {
  const total = signals.reduce((sum, row) => sum + row.riskScore, 0);
  return Math.min(100, total);
}

export function mapHighRiskUser(
  user: { id: string; displayName?: string | null; email: string; sellerStatus: string },
  signals: PrismaFraudSignal[],
): HighRiskUserSummary {
  const active = signals.filter((s) => !s.dismissedAt);
  const riskScore = aggregateRiskScore(active);
  const latest = active[0];

  return {
    userId: user.id,
    displayName: user.displayName ?? undefined,
    email: user.email,
    sellerStatus: user.sellerStatus,
    riskScore,
    riskLevel: fraudRiskLevel(riskScore),
    signalCount: active.length,
    breakdown: buildRiskBreakdown(
      active.map((s) => ({
        signalType: s.signalType as FraudSignalType,
        riskScore: s.riskScore,
      })),
    ),
    latestSignalAt: latest?.createdAt.toISOString(),
  };
}

export function mapHighRiskListing(
  listing: {
    id: string;
    title: string;
    sellerId: string;
    status: string;
    seller?: { displayName?: string | null };
  },
  signals: PrismaFraudSignal[],
): HighRiskListingSummary {
  const active = signals.filter((s) => !s.dismissedAt);
  const riskScore = aggregateRiskScore(active);

  return {
    listingId: listing.id,
    title: listing.title,
    sellerId: listing.sellerId,
    sellerName: listing.seller?.displayName ?? undefined,
    status: listing.status,
    riskScore,
    riskLevel: fraudRiskLevel(riskScore),
    signalCount: active.length,
    breakdown: buildRiskBreakdown(
      active.map((s) => ({
        signalType: s.signalType as FraudSignalType,
        riskScore: s.riskScore,
      })),
    ),
  };
}

export { FRAUD_SIGNAL_WEIGHTS };
