export type StripeConnectChargeModel = 'destination' | 'separate';

/**
 * destination — funds split at charge time (Stripe Connect destination charges).
 * separate — platform collects payment; seller is paid via POST /seller/settle-order transfer.
 */
export function getStripeConnectChargeModel(
  source: Record<string, string | undefined> = process.env,
): StripeConnectChargeModel {
  const raw = source.STRIPE_CONNECT_CHARGE_MODEL?.trim().toLowerCase();
  return raw === 'separate' ? 'separate' : 'destination';
}

export function usesSeparateConnectCharges(
  source: Record<string, string | undefined> = process.env,
): boolean {
  return getStripeConnectChargeModel(source) === 'separate';
}
