export interface AdminDashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalBuyers: number;
  activeListings: number;
  totalPayments: number;
  pendingVerifications: number;
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
