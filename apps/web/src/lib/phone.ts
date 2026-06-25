const IRISH_E164_REGEX = /^\+353\d{9}$/;
const GENERIC_E164_REGEX = /^\+[1-9]\d{7,14}$/;

/**
 * Normalizes Irish phone input to E.164 (+353XXXXXXXXX).
 * Accepts: +353871000002, 353871000002, 0871000002, 871000002, with spaces/dashes.
 */
export function normalizeIrishPhoneToE164(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let normalized = trimmed.replace(/[\s\-().]/g, '');

  if (normalized.startsWith('+')) {
    normalized = `+${normalized.slice(1).replace(/\D/g, '')}`;
    if (IRISH_E164_REGEX.test(normalized) || GENERIC_E164_REGEX.test(normalized)) {
      return normalized;
    }
    return null;
  }

  const digitsOnly = normalized.replace(/\D/g, '');

  if (digitsOnly.startsWith('00')) {
    const intl = `+${digitsOnly.slice(2)}`;
    if (IRISH_E164_REGEX.test(intl) || GENERIC_E164_REGEX.test(intl)) return intl;
    return null;
  }

  if (digitsOnly.startsWith('353')) {
    const e164 = `+${digitsOnly}`;
    if (IRISH_E164_REGEX.test(e164)) return e164;
    return null;
  }

  let national = digitsOnly;
  if (national.startsWith('0')) {
    national = national.slice(1);
  }

  if (/^\d{9}$/.test(national)) {
    const e164 = `+353${national}`;
    if (IRISH_E164_REGEX.test(e164)) return e164;
  }

  return null;
}

export function formatIrishPhoneHint(e164: string): string {
  if (!IRISH_E164_REGEX.test(e164)) return e164;
  const national = `0${e164.slice(4)}`;
  return `${e164} (${national})`;
}
