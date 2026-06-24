import type { StoreReview } from '@community-marketplace/types';
import { formatDateTime } from '@community-marketplace/utils';

import { EmptyState } from '@/components/shared/empty-state';

interface StoreReviewListProps {
  reviews: StoreReview[];
}

export function StoreReviewList({ reviews }: StoreReviewListProps) {
  if (reviews.length === 0) {
    return (
      <EmptyState
        title="No reviews yet"
        description="Be the first to leave a review after your purchase."
      />
    );
  }

  return (
    <ul className="mt-4 space-y-4">
      {reviews.map((review) => (
        <li key={review.id} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900">{review.reviewerName}</p>
            <span className="text-sm text-amber-500">{'★'.repeat(review.rating)}</span>
          </div>
          <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
          <p className="mt-2 text-xs text-gray-400">{formatDateTime(review.createdAt)}</p>
        </li>
      ))}
    </ul>
  );
}
