export type FraudSignalType =
  | 'high_risk_keywords'
  | 'repeated_listing_duplication'
  | 'rapid_listing_creation'
  | 'mismatched_location'
  | 'multiple_accounts_same_device'
  | 'flagged_messages'
  | 'buyer_reports'
  | 'suspicious_pricing';

export type FraudRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export const FRAUD_SIGNAL_TYPES: readonly FraudSignalType[] = [
  'high_risk_keywords',
  'repeated_listing_duplication',
  'rapid_listing_creation',
  'mismatched_location',
  'multiple_accounts_same_device',
  'flagged_messages',
  'buyer_reports',
  'suspicious_pricing',
] as const;

export const FRAUD_SIGNAL_WEIGHTS: Record<FraudSignalType, number> = {
  high_risk_keywords: 25,
  repeated_listing_duplication: 20,
  rapid_listing_creation: 15,
  mismatched_location: 20,
  multiple_accounts_same_device: 30,
  flagged_messages: 15,
  buyer_reports: 20,
  suspicious_pricing: 25,
};

export const FRAUD_SIGNAL_LABELS: Record<FraudSignalType, string> = {
  high_risk_keywords: 'High-risk keywords',
  repeated_listing_duplication: 'Repeated listing duplication',
  rapid_listing_creation: 'Rapid listing creation',
  mismatched_location: 'Mismatched location',
  multiple_accounts_same_device: 'Multiple accounts on same device',
  flagged_messages: 'Flagged messages',
  buyer_reports: 'Buyer reports',
  suspicious_pricing: 'Suspicious pricing',
};

export function fraudRiskLevel(score: number): FraudRiskLevel {
  if (score >= 81) return 'critical';
  if (score >= 51) return 'high';
  if (score >= 21) return 'medium';
  return 'low';
}

export interface FraudSignal {
  id: string;
  userId: string;
  listingId?: string;
  signalType: FraudSignalType;
  signalValue: string;
  riskScore: number;
  dismissedAt?: string;
  escalatedAt?: string;
  createdAt: string;
}

export interface FraudRiskBreakdownItem {
  signalType: FraudSignalType;
  label: string;
  count: number;
  totalScore: number;
}

export interface HighRiskUserSummary {
  userId: string;
  displayName?: string;
  email?: string;
  sellerStatus?: string;
  riskScore: number;
  riskLevel: FraudRiskLevel;
  signalCount: number;
  breakdown: FraudRiskBreakdownItem[];
  latestSignalAt?: string;
}

export interface HighRiskListingSummary {
  listingId: string;
  title: string;
  sellerId: string;
  sellerName?: string;
  status: string;
  riskScore: number;
  riskLevel: FraudRiskLevel;
  signalCount: number;
  breakdown: FraudRiskBreakdownItem[];
}
