import type { AdminPersonaRoleCode, RbacRole } from '@community-marketplace/types';

/** Stable bootstrap user IDs — one account per operator / marketplace tier. */
export const BOOTSTRAP_USER_IDS = {
  SUPER_ADMIN: '00000000-0000-4000-8000-000000000010',
  ADMIN: '00000000-0000-4000-8000-000000000011',
  ACCOUNTS_ADMIN: '00000000-0000-4000-8000-000000000014',
  MODERATION_ADMIN: '00000000-0000-4000-8000-000000000015',
  FINANCIAL_ADMIN: '00000000-0000-4000-8000-000000000016',
  MEMBER: '00000000-0000-4000-8000-000000000017',
} as const;

/** @deprecated Use BOOTSTRAP_USER_IDS */
export const DEV_BOOTSTRAP_USER_IDS = BOOTSTRAP_USER_IDS;

export type BootstrapRole = RbacRole | AdminPersonaRoleCode;

export interface BootstrapUserSeed {
  id: string;
  role: BootstrapRole;
  email: string;
  password: string;
  displayName: string;
  phone?: string;
}

/**
 * Level 1 — SUPER_ADMIN
 * Level 2 — ADMIN + scoped operator personas ({slug}-admin@sellnearby.ie)
 * Level 3 — MEMBER marketplace account
 */
export const BOOTSTRAP_USERS: BootstrapUserSeed[] = [
  {
    id: BOOTSTRAP_USER_IDS.SUPER_ADMIN,
    role: 'SUPER_ADMIN',
    email: 'superadmin@sellnearby.ie',
    password: 'ChangeMe!SuperAdmin1',
    displayName: 'Super Admin',
  },
  {
    id: BOOTSTRAP_USER_IDS.ADMIN,
    role: 'ADMIN',
    email: 'admin@sellnearby.ie',
    password: 'ChangeMe!Admin1',
    displayName: 'Platform Admin',
  },
  {
    id: BOOTSTRAP_USER_IDS.ACCOUNTS_ADMIN,
    role: 'ACCOUNTS_ADMIN',
    email: 'accounts-admin@sellnearby.ie',
    password: 'ChangeMe!Accounts1',
    displayName: 'Accounts Admin',
  },
  {
    id: BOOTSTRAP_USER_IDS.MODERATION_ADMIN,
    role: 'MODERATION_ADMIN',
    email: 'moderation-admin@sellnearby.ie',
    password: 'ChangeMe!Moderation1',
    displayName: 'Moderation Admin',
  },
  {
    id: BOOTSTRAP_USER_IDS.FINANCIAL_ADMIN,
    role: 'FINANCIAL_ADMIN',
    email: 'financial-admin@sellnearby.ie',
    password: 'ChangeMe!Financial1',
    displayName: 'Financial Admin',
  },
  {
    id: BOOTSTRAP_USER_IDS.MEMBER,
    role: 'MEMBER',
    email: 'member@sellnearby.ie',
    password: 'ChangeMe!Member1',
    displayName: 'Marketplace Member',
    phone: '+353871000099',
  },
];
