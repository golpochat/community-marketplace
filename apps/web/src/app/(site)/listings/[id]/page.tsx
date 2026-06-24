import { ListingDetailClient } from '@/components/listings/listing-detail-client';

export const metadata = { title: 'Listing Details' };

interface ListingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;
  return <ListingDetailClient id={id} />;
}
