import type { AdminPersonaRoleCode, RbacRole } from '@community-marketplace/types';

/** Stable dev IDs — align with prisma seed in deployed environments */
export const DEV_ROLE_IDS: Record<RbacRole, string> = {
  SUPER_ADMIN: '00000000-0000-4000-8000-000000000001',
  ADMIN: '00000000-0000-4000-8000-000000000002',
  SELLER: '00000000-0000-4000-8000-000000000003',
  BUYER: '00000000-0000-4000-8000-000000000004',
  MEMBER: '00000000-0000-4000-8000-000000000008',
};

export const DEV_PERSONA_ROLE_IDS: Record<AdminPersonaRoleCode, string> = {
  ACCOUNTS_ADMIN: '00000000-0000-4000-8000-000000000005',
  MODERATION_ADMIN: '00000000-0000-4000-8000-000000000006',
  FINANCIAL_ADMIN: '00000000-0000-4000-8000-000000000007',
};

export function devRoleIdFor(role: RbacRole): string {
  return DEV_ROLE_IDS[role];
}

export function devRoleIdForCode(code: string): string | undefined {
  if (code in DEV_ROLE_IDS) {
    return DEV_ROLE_IDS[code as RbacRole];
  }
  if (code in DEV_PERSONA_ROLE_IDS) {
    return DEV_PERSONA_ROLE_IDS[code as AdminPersonaRoleCode];
  }
  return undefined;
}
