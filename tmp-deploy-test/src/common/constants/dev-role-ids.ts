import type { RbacRole } from '@community-marketplace/types';

/** Stable dev IDs — align with prisma seed in deployed environments */
export const DEV_ROLE_IDS: Record<RbacRole, string> = {
  SUPER_ADMIN: '00000000-0000-4000-8000-000000000001',
  ADMIN: '00000000-0000-4000-8000-000000000002',
  SELLER: '00000000-0000-4000-8000-000000000003',
  BUYER: '00000000-0000-4000-8000-000000000004',
};

export function devRoleIdFor(role: RbacRole): string {
  return DEV_ROLE_IDS[role];
}
