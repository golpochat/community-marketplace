'use client';



import { useState } from 'react';



import { Button, Input, Label } from '@community-marketplace/ui';

import { Star } from 'lucide-react';



import { trustService } from '@/services/trust.service';



interface ReviewBuyerPromptDialogProps {

  listingId: string;

  buyerId: string;

  buyerName?: string;

  onSubmitted?: () => void;

  onDismiss?: () => void;

}



export function ReviewBuyerPromptDialog({

  listingId,

  buyerId,

  buyerName,

  onSubmitted,

  onDismiss,

}: ReviewBuyerPromptDialogProps) {

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

      await trustService.createBuyerReview({

        listingId,

        buyerId,

        rating,

        comment: comment.trim() || undefined,

      });

      onSubmitted?.();

    } catch {

      setError('Could not submit your review. Please try again.');

    } finally {

      setSubmitting(false);

    }

  }



  return (

    <div className="rounded-xl border border-border bg-card p-5 shadow-brand-sm">

      <h3 className="text-base font-semibold text-foreground">Rate this buyer</h3>

      <p className="mt-1 text-sm text-muted-foreground">

        How was your experience{buyerName ? ` with ${buyerName}` : ''}?

      </p>



      <div className="mt-4 flex gap-1" role="group" aria-label="Star rating">

        {[1, 2, 3, 4, 5].map((value) => (

          <button

            key={value}

            type="button"

            onClick={() => setRating(value)}

            className="rounded p-1 transition-colors hover:bg-muted/50"

            aria-label={`${value} star${value === 1 ? '' : 's'}`}

          >

            <Star

              className={`h-7 w-7 ${value <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`}

              aria-hidden

            />

          </button>

        ))}

      </div>



      <div className="mt-4">

        <Label htmlFor="buyer-review-comment">Comment (optional)</Label>

        <Input

          id="buyer-review-comment"

          value={comment}

          onChange={(e) => setComment(e.target.value)}

          placeholder="Share details about this buyer…"

          className="mt-1.5"

        />

      </div>



      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}



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


