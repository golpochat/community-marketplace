import { UsersTable } from '@/components/users/users-table';
import { adminServerService } from '@/services/admin.service.server';

export const metadata = { title: 'Users' };

export default async function UsersPage() {
  const users = await adminServerService.getUsers();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Users</h1>
      <p className="mt-1 text-sm text-gray-600">Manage platform users</p>
      <div className="mt-8">
        <UsersTable users={users} />
      </div>
    </div>
  );
}
