import type { UserProfile } from '@community-marketplace/types';

import { UsersManagement } from '@/components/users/users-management';
import { requireAdminPermission } from '@/lib/server-rbac';
import { adminServerService } from '@/services/admin.service.server';

export const metadata = { title: 'Users' };

export default async function UsersPage() {
  await requireAdminPermission('users');
  const result = await adminServerService.getUsers();
  const users = (result as { data?: UserProfile[] }).data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Users</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage platform users</p>
      <div className="mt-8">
        <UsersManagement initialUsers={users} />
      </div>
    </div>
  );
}
