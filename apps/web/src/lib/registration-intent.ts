export const REGISTRATION_INTENT_STORAGE_KEY = 'cm-registration-intent';

export type RegistrationIntent = 'seller';

export function persistRegistrationIntent(intent: RegistrationIntent): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(REGISTRATION_INTENT_STORAGE_KEY, intent);
}

export function consumeRegistrationIntent(): RegistrationIntent | null {
  if (typeof window === 'undefined') return null;
  const value = sessionStorage.getItem(REGISTRATION_INTENT_STORAGE_KEY);
  sessionStorage.removeItem(REGISTRATION_INTENT_STORAGE_KEY);
  return value === 'seller' ? 'seller' : null;
}

export function parseRegistrationIntent(value: string | null): RegistrationIntent | null {
  return value === 'seller' ? 'seller' : null;
}
