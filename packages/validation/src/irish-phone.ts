/** Irish mobile network access codes (ComReg 08X + 7 digits; X = 3,5,6,7,9). */
export const IRISH_MOBILE_PREFIXES = ['083', '085', '086', '087', '089'] as const;

export const IRISH_MOBILE_E164_REGEX = /^\+353(83|85|86|87|89)\d{7}$/;

export const IRISH_MOBILE_NATIONAL_REGEX = /^08[356789]\d{7}$/;

export const IRISH_MOBILE_VALIDATION_MESSAGE =
  'Enter a valid Irish mobile number starting with 083, 085, 086, 087, or 089 (e.g. 087 123 4567).';

export const IRISH_MOBILE_PREFIX_TOOLTIP =
  'Irish mobiles start with 083, 085, 086, 087, or 089 — 10 digits nationally (e.g. 087 123 4567 or +353 87 123 4567).';

export function isValidIrishMobileNational(national9Digits: string): boolean {
  return /^(83|85|86|87|89)\d{7}$/.test(national9Digits);
}

/**
 * Normalizes Irish mobile input to E.164 (+353XXXXXXXXX).
 * Accepts: +353871000002, 353871000002, 0871000002, 871000002, with spaces/dashes.
 */
export function normalizeIrishPhoneToE164(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let normalized = trimmed.replace(/[\s\-().]/g, '');

  if (normalized.startsWith('+')) {
    normalized = `+${normalized.slice(1).replace(/\D/g, '')}`;
    if (IRISH_MOBILE_E164_REGEX.test(normalized)) {
      return normalized;
    }
    return null;
  }

  const digitsOnly = normalized.replace(/\D/g, '');

  if (digitsOnly.startsWith('00')) {
    const intl = `+${digitsOnly.slice(2)}`;
    if (IRISH_MOBILE_E164_REGEX.test(intl)) return intl;
    return null;
  }

  if (digitsOnly.startsWith('353')) {
    const e164 = `+${digitsOnly}`;
    if (IRISH_MOBILE_E164_REGEX.test(e164)) return e164;
    return null;
  }

  let national = digitsOnly;
  if (national.startsWith('0')) {
    national = national.slice(1);
  }

  if (isValidIrishMobileNational(national)) {
    const e164 = `+353${national}`;
    if (IRISH_MOBILE_E164_REGEX.test(e164)) return e164;
  }

  return null;
}

export function formatIrishPhoneHint(e164: string): string {
  if (!IRISH_MOBILE_E164_REGEX.test(e164)) return e164;
  const national = `0${e164.slice(4)}`;
  return `${e164} (${national})`;
}
