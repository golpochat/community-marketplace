export type EmailProviderId = 'brevo' | 'sendgrid' | 'ses' | 'stub';

export interface EmailPlatformSettings {
  emailProvider: EmailProviderId;
  emailFallbackEnabled: boolean;
  emailFromAddressOverrideEnabled: boolean;
  emailFromAddress: string | null;
  emailFromNameOverrideEnabled: boolean;
  emailFromName: string | null;
}

export interface EmailEnvSenderDefaults {
  fromAddress: string;
  fromName: string;
}

export interface EmailProviderStatusItem {
  id: EmailProviderId;
  label: string;
  configured: boolean;
  description: string;
}

export interface EmailSystemStatus {
  settings: EmailPlatformSettings;
  envDefaults: EmailEnvSenderDefaults;
  effectiveSender: EmailEnvSenderDefaults;
  providers: EmailProviderStatusItem[];
  activeProvider: EmailProviderId;
  activeProviderConfigured: boolean;
}

export interface EmailSendOutcome {
  sent: boolean;
  provider: EmailProviderId;
  mode: 'live' | 'stub';
  messageId?: string;
  attemptedProviders?: EmailProviderId[];
}
