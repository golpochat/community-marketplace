import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import {
  adminActionSchema,
  createListingReviewSchema,
  createRoleSchema,
  legacyCreateReportSchema,
  loginSchema,
  registerDeviceSchema,
  sendAdminNotificationSchema,
} from '@community-marketplace/validation';

const SRC_ROOT = path.resolve(__dirname, '../src');
const UUID = '11111111-1111-4111-8111-111111111111';

function collectTsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) return collectTsFiles(full);
    return full.endsWith('.ts') ? [full] : [];
  });
}

describe('HTTP Zod validation pipeline', () => {
  it('does not keep class-validator DTOs or a global ValidationPipe', () => {
    const files = collectTsFiles(SRC_ROOT);
    const dtoFiles = files.filter((file) => file.includes(`${path.sep}dto${path.sep}`));
    const classValidatorFiles = files.filter((file) =>
      readFileSync(file, 'utf8').includes('class-validator'),
    );
    const main = readFileSync(path.join(SRC_ROOT, 'main.ts'), 'utf8');

    expect(dtoFiles).toEqual([]);
    expect(classValidatorFiles).toEqual([]);
    expect(main).not.toMatch(/ValidationPipe/);
  });

  it('normalizes login email and rejects short passwords', () => {
    expect(loginSchema.parse({ email: '  Admin@SellNearby.ie ', password: 'ChangeMe!Admin1' })).toEqual({
      email: 'admin@sellnearby.ie',
      password: 'ChangeMe!Admin1',
    });
    expect(() => loginSchema.parse({ email: 'admin@sellnearby.ie', password: 'short' })).toThrow(ZodError);
  });

  it('accepts MEMBER custom-role templates and rejects unknown ones', () => {
    expect(
      createRoleSchema.parse({
        name: 'Community host',
        template: 'MEMBER',
      }).template,
    ).toBe('MEMBER');
    expect(() => createRoleSchema.parse({ name: 'Bad', template: 'SUPER_ADMIN' })).toThrow(ZodError);
  });

  it('validates remaining HTTP command payloads', () => {
    expect(
      registerDeviceSchema.parse({ token: 'device-token-1', platform: 'web' }),
    ).toMatchObject({ platform: 'web' });
    expect(() => registerDeviceSchema.parse({ token: 'short', platform: 'web' })).toThrow(ZodError);

    expect(
      createListingReviewSchema.parse({ listingId: UUID, rating: 5, comment: 'Great' }),
    ).toMatchObject({ rating: 5 });
    expect(() => createListingReviewSchema.parse({ listingId: UUID, rating: 9 })).toThrow(ZodError);

    expect(
      legacyCreateReportSchema.parse({
        targetType: 'listing',
        targetId: UUID,
        reason: 'spam listing',
      }),
    ).toMatchObject({ targetType: 'listing' });

    expect(
      adminActionSchema.parse({
        action: 'listing_approve',
        targetType: 'listing',
        targetId: UUID,
      }),
    ).toMatchObject({ action: 'listing_approve' });
    expect(() =>
      adminActionSchema.parse({ action: 'not-a-real-action', targetType: 'listing', targetId: UUID }),
    ).toThrow(ZodError);

    expect(
      sendAdminNotificationSchema.parse({
        userId: UUID,
        type: 'listing_rejected',
        title: 'Removed',
        body: 'Your listing was removed.',
      }),
    ).toMatchObject({ type: 'listing_rejected' });
  });
});
