import { ListingsManagement } from '@/components/listings/listings-management';
import { requireAdminPermission } from '@/lib/server-rbac';
import { adminServerService } from '@/services/admin.service.server';

export const metadata = { title: 'Listings' };

export default async function ListingsPage() {
  await requireAdminPermission('listings');
  const listings = await adminServerService.getListings();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Listings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage marketplace listings</p>
      <div className="mt-8">
        <ListingsManagement listings={listings} />
      </div>
    </div>
  );
}
