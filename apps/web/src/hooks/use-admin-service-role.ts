'use client';

import { useAuth } from '@/hooks/use-auth';
import type { AdminServiceRole } from '@/services/admin-seller-verification.service';

export function useAdminServiceRole(): AdminServiceRole {
  const { user } = useAuth();
  return user?.role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : 'ADMIN';
}
