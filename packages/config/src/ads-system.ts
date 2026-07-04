/**
 * Unified advertising system — feature registry, modules, and flag definitions.
 *
 * Deploy-time flags (env): ADS_SYSTEM_ENABLED, ADS_PREVIEW_MODE
 * Runtime publish toggles (platform_settings): displayAdsEnabled, boostsEnabled, featuredEnabled
 */

export const ADS_SYSTEM_CODE = 'ads_system' as const;

export type AdsSystemModuleCode =
  | 'display_advertising'
  | 'listing_boost'
  | 'featured_slots';

export type AdsSystemEnvFlag = 'ADS_SYSTEM_ENABLED' | 'ADS_PREVIEW_MODE';

export type AdsSystemPublishFlag =
  | 'DISPLAY_ADVERTISING_PUBLISHED'
  | 'LISTING_BOOST_PUBLISHED'
  | 'FEATURED_PUBLISHED';

export interface AdsSystemModuleDefinition {
  code: AdsSystemModuleCode;
  /** Attached from an existing feature rather than newly created. */
  attached?: boolean;
  /** Admin can toggle publish state at runtime. */
  withPublishToggle?: boolean;
  /** Module ships built but hidden until published. */
  unpublished?: boolean;
  publishFlag: AdsSystemPublishFlag;
  /** Maps publish flag to platform_settings column. */
  settingsField: 'displayAdsEnabled' | 'boostsEnabled' | 'featuredEnabled';
  defaultPublished: boolean;
}

export const ADS_SYSTEM_ENV_DEFAULTS: Record<AdsSystemEnvFlag, boolean> = {
  ADS_SYSTEM_ENABLED: false,
  ADS_PREVIEW_MODE: false,
};

export const ADS_SYSTEM_MODULES: Record<AdsSystemModuleCode, AdsSystemModuleDefinition> = {
  display_advertising: {
    code: 'display_advertising',
    unpublished: true,
    withPublishToggle: true,
    publishFlag: 'DISPLAY_ADVERTISING_PUBLISHED',
    settingsField: 'displayAdsEnabled',
    defaultPublished: false,
  },
  listing_boost: {
    code: 'listing_boost',
    attached: true,
    withPublishToggle: true,
    publishFlag: 'LISTING_BOOST_PUBLISHED',
    settingsField: 'boostsEnabled',
    defaultPublished: true,
  },
  featured_slots: {
    code: 'featured_slots',
    attached: true,
    withPublishToggle: true,
    publishFlag: 'FEATURED_PUBLISHED',
    settingsField: 'featuredEnabled',
    defaultPublished: true,
  },
};

export const ADS_SYSTEM_MODULE_CODES = Object.keys(
  ADS_SYSTEM_MODULES,
) as AdsSystemModuleCode[];

export function parseAdsEnvFlag(
  value: string | undefined,
  flag: AdsSystemEnvFlag,
): boolean {
  if (value === undefined || value === '') {
    return ADS_SYSTEM_ENV_DEFAULTS[flag];
  }
  return value === 'true' || value === '1';
}
