import { APP_SHORT_NAME } from './constants';
import { BRAND_COLORS } from './brand';

/**
 * Stripe Connect Express onboarding branding.
 * The hosted Stripe UI (phone, bank, KYC) reads platform branding from the Stripe Dashboard:
 * Settings → Connect → Onboarding options → Branding.
 * Keep these values in sync when updating the Dashboard.
 */
export const STRIPE_CONNECT_BRANDING = {
  platformName: APP_SHORT_NAME,
  primaryColor: BRAND_COLORS.primary,
  secondaryColor: BRAND_COLORS.primaryDark,
  accentColor: BRAND_COLORS.accent,
  /** Short line shown on our pre-redirect screen (Stripe shows its own copy on hosted pages). */
  partnerLine: `${APP_SHORT_NAME} partners with Stripe for secure payments and payouts.`,
} as const;

export type StripeConnectBranding = typeof STRIPE_CONNECT_BRANDING;
