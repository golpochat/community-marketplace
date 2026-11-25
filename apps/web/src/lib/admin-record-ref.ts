import { compactUuid } from '@community-marketplace/utils';

/** Admin tables should not use UUID prefixes — seed IDs all start with 00000000. */
export function formatAdminRecordRef(id: string, receiptNumber?: string | null): string {
  const receipt = receiptNumber?.trim();
  return receipt || compactUuid(id);
}
