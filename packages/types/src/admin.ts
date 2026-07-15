export interface AdminDashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalBuyers: number;
  activeListings: number;
  totalPayments: number;
  pendingVerifications: number;
  pendingFastTrackVerifications: number;
  overdueFastTrackVerifications: number;
  pendingReports: number;
  activeBans: number;
  revenue: number;
  platformHealth: {
    database: "healthy" | "degraded" | "down";
    search: "healthy" | "degraded" | "down";
    payments: "healthy" | "degraded" | "down";
  };
  generatedAt: string;
}

export interface SuperAdminGovernanceMetrics {
  activeAdminCount: number;
  pendingInvitations: number;
  openDisputes: number;
  openFraudSignals: number;
  pendingListingReviews: number;
  pendingSellerVerifications: number;
}

export interface SuperAdminPlatformFlags {
  maintenanceMode: boolean;
  securityMfaRequired: boolean;
}

export interface SuperAdminActivityEvent {
  id: string;
  source: 'user' | 'moderation';
  eventType: string;
  /** Human-readable event title for operators. */
  eventLabel: string;
  createdAt: string;
  actorId?: string;
  actorLabel?: string;
  targetUserId?: string;
  targetLabel?: string;
  reportId?: string;
  userId?: string;
  subjectLabel?: string;
  /** Human-readable detail line for the audit table. */
  detail: string;
  metadata?: Record<string, unknown>;
}

export interface SuperAdminPlatformOverview extends AdminDashboardStats {
  roles: number;
  permissions: number;
  governance: SuperAdminGovernanceMetrics;
  platformFlags: SuperAdminPlatformFlags;
  recentActivity: SuperAdminActivityEvent[];
}

export interface PlatformSettings {
  maintenanceMode: boolean;
  platformNameOverrideEnabled: boolean;
  platformName: string | null;
  supportEmailOverrideEnabled: boolean;
  supportEmail: string | null;
  defaultCurrencyOverrideEnabled: boolean;
  defaultCurrency: string | null;
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  securityMfaRequired: boolean;
}

export type {
  PlatformGovernanceSettings,
  PlatformGovernanceEnvDefaults,
  PlatformGovernanceEffective,
  PlatformGovernanceStatus,
  PlatformPaymentsStatus,
  PlatformPublicMeta,
} from './platform-governance';

export interface AdminMeResponse {
  userId: string;
  email: string;
  displayName?: string;
  role: "ADMIN" | "SUPER_ADMIN";
  permissions: string[];
}
