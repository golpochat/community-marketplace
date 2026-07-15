/** Canonical return URL after Stripe Connect Express onboarding. */
export function stripeConnectReturnPath(): string {
  return '/account/earnings?connect=return';
}

export function stripeConnectReturnUrl(origin?: string): string {
  const base = origin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}${stripeConnectReturnPath()}`;
}
