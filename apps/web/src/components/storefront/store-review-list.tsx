import type { StoreReview } from '@community-marketplace/types';
import { formatDateTime } from '@community-marketplace/utils';
import { Star } from 'lucide-react';

import { EmptyState } from '@/components/shared/empty-state';

interface StoreReviewListProps {
  reviews: StoreReview[];
}

function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${
            index < rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
          }`}
          aria-hidden
        />
      ))}
    </span>
  );
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
    <ul className="grid gap-4 sm:grid-cols-2">
      {reviews.map((review) => (
        <li
          key={review.id}
          className="rounded-brand-md border border-gray-200 bg-white p-4 shadow-brand-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold text-gray-900">{review.reviewerName}</p>
            <ReviewStars rating={review.rating} />
          </div>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">{review.comment}</p>
          <p className="mt-3 text-xs text-gray-400">{formatDateTime(review.createdAt)}</p>
        </li>
      ))}
    </ul>
  );
}
