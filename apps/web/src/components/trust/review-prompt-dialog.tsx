'use client';

import { useState } from 'react';

import { Button, Input, Label } from '@community-marketplace/ui';
import { Star } from 'lucide-react';

import { buyerService } from '@/services/marketplace.service';

interface ReviewPromptDialogProps {
  listingId: string;
  sellerName?: string;
  onSubmitted?: () => void;
  onDismiss?: () => void;
}

export function ReviewPromptDialog({
  listingId,
  sellerName,
  onSubmitted,
  onDismiss,
}: ReviewPromptDialogProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (rating < 1) {
      setError('Please select a star rating.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await buyerService.createReview({ listingId, rating, comment: comment.trim() || undefined });
      onSubmitted?.();
    } catch {
      setError('Could not submit your review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-brand-sm">
      <h3 className="text-base font-semibold text-gray-900">Rate your experience</h3>
      <p className="mt-1 text-sm text-gray-600">
        How was your experience{sellerName ? ` with ${sellerName}` : ''}?
      </p>

      <div className="mt-4 flex gap-1" role="group" aria-label="Star rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className="rounded p-1 transition-colors hover:bg-gray-50"
            aria-label={`${value} star${value === 1 ? '' : 's'}`}
          >
            <Star
              className={`h-7 w-7 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
              aria-hidden
            />
          </button>
        ))}
      </div>

      <div className="mt-4">
        <Label htmlFor="review-comment">Comment (optional)</Label>
        <Input
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share details about your experience…"
          className="mt-1.5"
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex gap-2">
        <Button type="button" onClick={handleSubmit} disabled={submitting} className="flex-1">
          {submitting ? 'Submitting…' : 'Submit review'}
        </Button>
        {onDismiss && (
          <Button type="button" variant="outline" onClick={onDismiss}>
            Later
          </Button>
        )}
      </div>
    </div>
  );
}
