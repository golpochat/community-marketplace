import type { RbacRole } from '@community-marketplace/types';

import { SUPER_ADMIN_BOOTSTRAP_USER_ID } from './rbac-seed.data';

/** Stable development user IDs — one account per role. */
export const DEV_BOOTSTRAP_USER_IDS = {
  SUPER_ADMIN: SUPER_ADMIN_BOOTSTRAP_USER_ID,
  ADMIN: '00000000-0000-4000-8000-000000000011',
  SELLER: '00000000-0000-4000-8000-000000000012',
  BUYER: '00000000-0000-4000-8000-000000000013',
} as const;

export interface DevBootstrapUserSeed {
  id: string;
  role: RbacRole;
  email: string;
  password: string;
  displayName: string;
  phone?: string;
}

export const DEV_BOOTSTRAP_USERS: DevBootstrapUserSeed[] = [
  {
    id: DEV_BOOTSTRAP_USER_IDS.SUPER_ADMIN,
    role: 'SUPER_ADMIN',
    email: 'superadmin@community.market',
    password: 'ChangeMe!SuperAdmin1',
    displayName: 'Super Admin',
  },
  {
    id: DEV_BOOTSTRAP_USER_IDS.ADMIN,
    role: 'ADMIN',
    email: 'admin@community.market',
    password: 'ChangeMe!Admin1',
    displayName: 'Platform Admin',
  },
  {
    id: DEV_BOOTSTRAP_USER_IDS.SELLER,
    role: 'SELLER',
    email: 'seller@community.market',
    password: 'ChangeMe!Seller1',
    displayName: 'Demo Seller',
    phone: '+353871000001',
  },
  {
    id: DEV_BOOTSTRAP_USER_IDS.BUYER,
    role: 'BUYER',
    email: 'buyer@community.market',
    password: 'ChangeMe!Buyer1',
    displayName: 'Demo Buyer',
    phone: '+353871000002',
  },
];
