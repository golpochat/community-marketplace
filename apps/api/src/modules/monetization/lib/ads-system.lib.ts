import type { AdsSystemModuleCode } from '@community-marketplace/config';
import {
  ADS_SYSTEM_MODULE_CODES,
  ADS_SYSTEM_MODULES,
  parseAdsEnvFlag,
} from '@community-marketplace/config';

import type { MonetizationSettings } from '@community-marketplace/types';
import type { AdsSystemModuleState } from '@community-marketplace/types';

export interface AdsSystemEnv {
  systemEnabled: boolean;
  previewMode: boolean;
}

export function readAdsSystemEnv(
  source: NodeJS.ProcessEnv = process.env,
): AdsSystemEnv {
  return {
    systemEnabled: parseAdsEnvFlag(source.ADS_SYSTEM_ENABLED, 'ADS_SYSTEM_ENABLED'),
    previewMode: parseAdsEnvFlag(source.ADS_PREVIEW_MODE, 'ADS_PREVIEW_MODE'),
  };
}

function readModulePublished(
  settings: MonetizationSettings,
  moduleCode: AdsSystemModuleCode,
): boolean {
  const module = ADS_SYSTEM_MODULES[moduleCode];
  return settings[module.settingsField];
}

function isModuleEffective(
  env: AdsSystemEnv,
  published: boolean,
  moduleCode: AdsSystemModuleCode,
): boolean {
  if (moduleCode === 'display_advertising') {
    return env.systemEnabled && (published || env.previewMode);
  }

  // Attached modules (listing boost, featured slots) stay available when published,
  // independent of the master ads system deploy flag.
  return published;
}

export function resolveAdsSystemModule(
  env: AdsSystemEnv,
  settings: MonetizationSettings,
  moduleCode: AdsSystemModuleCode,
): AdsSystemModuleState {
  const published = readModulePublished(settings, moduleCode);
  const effective = isModuleEffective(env, published, moduleCode);
  const preview =
    moduleCode === 'display_advertising' &&
    env.systemEnabled &&
    env.previewMode &&
    !published;

  return {
    code: moduleCode,
    published,
    effective,
    preview,
  };
}

export function resolveAdsSystemStatus(
  env: AdsSystemEnv,
  settings: MonetizationSettings,
) {
  return {
    feature: 'ads_system' as const,
    systemEnabled: env.systemEnabled,
    previewMode: env.previewMode,
    modules: ADS_SYSTEM_MODULE_CODES.map((code) =>
      resolveAdsSystemModule(env, settings, code),
    ),
  };
}

export function isListingBoostEffective(
  env: AdsSystemEnv,
  settings: MonetizationSettings,
): boolean {
  return resolveAdsSystemModule(env, settings, 'listing_boost').effective;
}

export function isFeaturedSlotsEffective(
  env: AdsSystemEnv,
  settings: MonetizationSettings,
): boolean {
  return resolveAdsSystemModule(env, settings, 'featured_slots').effective;
}

export function isDisplayAdvertisingEffective(
  env: AdsSystemEnv,
  settings: MonetizationSettings,
): boolean {
  return resolveAdsSystemModule(env, settings, 'display_advertising').effective;
}
