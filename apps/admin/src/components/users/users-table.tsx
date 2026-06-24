import type { User } from '@community-marketplace/types';

interface UsersTableProps {
  users: User[];
}

export function UsersTable({ users }: UsersTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{user.email}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{user.role}</td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
