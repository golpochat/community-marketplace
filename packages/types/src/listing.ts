export type ListingStatus = 'draft' | 'active' | 'sold' | 'archived';

export type ListingCondition = 'new' | 'like_new' | 'good' | 'fair' | 'poor';

export interface Listing {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  condition: ListingCondition;
  status: ListingStatus;
  location: string;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ListingSummary {
  id: string;
  title: string;
  price: number;
  currency: string;
  location: string;
  status: ListingStatus;
  imageUrl?: string;
}
