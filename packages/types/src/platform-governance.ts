export interface PlatformGovernanceSettings {
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

export interface PlatformGovernanceEnvDefaults {
  platformName: string;
  supportEmail: string;
  defaultCurrency: string;
}

export interface PlatformGovernanceEffective {
  platformName: string;
  supportEmail: string;
  defaultCurrency: string;
}

export interface PlatformPaymentsStatus {
  provider: 'stripe';
  configured: boolean;
}

export interface PlatformGovernanceStatus {
  settings: PlatformGovernanceSettings;
  envDefaults: PlatformGovernanceEnvDefaults;
  effective: PlatformGovernanceEffective;
  payments: PlatformPaymentsStatus;
}

export interface PlatformPublicMeta {
  platformName: string;
  supportEmail: string;
  defaultCurrency: string;
  maintenanceMode: boolean;
}
