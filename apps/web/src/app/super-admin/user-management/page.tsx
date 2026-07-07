import { Suspense } from 'react';

import { SuperAdminUserManagementPage } from '@/components/dashboard/super-admin-operators-page';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SuperAdminUserManagementPage />
    </Suspense>
  );
}
