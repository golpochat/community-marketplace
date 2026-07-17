/**
 * Redact common PII before sending listing context to third-party AI providers
 * or storing it in AiGenerationLog.inputSummary.
 */
export function scrubPii(text: string): string {
  if (!text) return text;

  let out = text;

  // Emails
  out = out.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[email redacted]',
  );

  // E.164 / international with + (e.g. +353 87 123 4567)
  out = out.replace(
    /\+\d{1,3}[\s.-]?(?:\(?\d{1,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}\b/g,
    '[phone redacted]',
  );

  // Irish mobiles: 083–089 + 7 digits (with optional spaces/dashes)
  out = out.replace(
    /(?<!\d)0?8[3-9][\s.-]?\d{3}[\s.-]?\d{4}(?!\d)/g,
    '[phone redacted]',
  );

  // Irish PPS-like: 7 digits + 1–2 letters (avoid matching prices)
  out = out.replace(
    /(?<![A-Za-z0-9])\d{7}[A-Za-z]{1,2}(?![A-Za-z0-9])/g,
    '[pps redacted]',
  );

  return out;
}
