import { describe, expect, it } from 'vitest';

import { formatAdminRecordRef } from '@/lib/admin-record-ref';

describe('formatAdminRecordRef', () => {
  it('prefers a receipt number when present', () => {
    expect(
      formatAdminRecordRef('00000000-0000-4000-9000-000000000100', 'RCPT-TEST-0001'),
    ).toBe('RCPT-TEST-0001');
  });

  it('uses the unique UUID suffix instead of the shared 00000000 prefix', () => {
    expect(formatAdminRecordRef('00000000-0000-4000-9000-000000000100')).toBe('00000100');
    expect(formatAdminRecordRef('00000000-0000-4000-9000-000000000016')).toBe('00000016');
  });
});
