import { createHash, randomInt, randomUUID } from 'node:crypto';

export function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function generateOtpCode(): string {
  return String(randomInt(100000, 1000000));
}

export function generateSessionId(): string {
  return randomUUID();
}
