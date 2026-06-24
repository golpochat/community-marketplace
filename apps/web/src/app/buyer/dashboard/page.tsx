'use client';

import { useUserProfile } from '@/hooks/use-user-profile';
import { useAuth } from '@/hooks/use-auth';

export default function BuyerDashboardPage() {
  const { user } = useAuth();
  const { profile, permissions, loading, error } = useUserProfile();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Buyer Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">
        Track purchases, saved listings, and messages.
      </p>
      {loading && <p className="mt-4 text-sm text-gray-500">Loading profile...</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {profile && (
        <div className="mt-6 rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
          <p>Email: {profile.email}</p>
          <p>Status: {profile.status}</p>
          <p>Profile completed: {profile.profileCompleted ? 'Yes' : 'No'}</p>
          {permissions && (
            <p className="mt-2 text-gray-500">
              Effective permissions: {permissions.effective.length}
            </p>
          )}
        </div>
      )}
      {!profile && user && !loading && (
        <p className="mt-4 text-sm text-gray-500">Signed in as {user.email}</p>
      )}
    </div>
  );
}
