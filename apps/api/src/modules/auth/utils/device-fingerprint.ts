import { createHash } from 'node:crypto';

export function computeDeviceFingerprint(
  userAgent?: string,
  ipAddress?: string,
  clientFingerprint?: string,
): string {
  const material = [userAgent ?? '', ipAddress ?? '', clientFingerprint ?? ''].join('|');
  return createHash('sha256').update(material).digest('hex').slice(0, 32);
}
