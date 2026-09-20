export const COOKIE_CONSENT_STORAGE_KEY = 'sellnearby.cookie-consent';
export const COOKIE_CONSENT_EVENT = 'sellnearby-cookie-consent';

export type CookieConsentChoice = 'necessary' | 'analytics';

export function readCookieConsent(): CookieConsentChoice | null {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  if (value === 'necessary' || value === 'analytics') return value;
  return null;
}

export function writeCookieConsent(choice: CookieConsentChoice): void {
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, choice);
  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT));
}

export function analyticsConsentGranted(choice: CookieConsentChoice | null): boolean {
  return choice === 'analytics';
}
