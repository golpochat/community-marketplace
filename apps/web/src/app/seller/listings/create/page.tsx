'use client';

import { DashboardCard, PageHeader } from '@community-marketplace/ui-dashboard';

import { ListingForm } from '@/components/seller/listing-form';

export default function CreateListingPage() {
  return (
    <>
      <PageHeader title="Create Listing" description="Add a new item to your store." />
      <DashboardCard>
        <ListingForm />
      </DashboardCard>
    </>
  );
}
