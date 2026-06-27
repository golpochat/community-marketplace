'use client';

import { useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import type { BoostIntentResponse } from '@community-marketplace/types';

import { monetizationService } from '@/services/monetization.service';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

function isDevClientSecret(clientSecret: string): boolean {
  return clientSecret.includes('_dev_') || !clientSecret.startsWith('pi_');
}

function BoostCheckoutForm({
  purchaseId,
  onSuccess,
}: {
  purchaseId: string;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (result.error) {
      setError(result.error.message ?? 'Payment failed');
      setProcessing(false);
      return;
    }

    try {
      await monetizationService.confirmBoost(purchaseId);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm boost');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {processing ? 'Processing…' : 'Pay and boost'}
      </button>
    </form>
  );
}

function DevConfirmButton({
  purchaseId,
  onSuccess,
}: {
  purchaseId: string;
  onSuccess: () => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setProcessing(true);
    setError(null);
    try {
      await monetizationService.confirmBoost(purchaseId);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm boost');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
        Stripe is not configured. Use dev confirm to activate the boost locally.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={() => void handleConfirm()}
        disabled={processing}
        className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {processing ? 'Confirming…' : 'Confirm boost (dev)'}
      </button>
    </div>
  );
}

interface BoostCheckoutPanelProps {
  intent: BoostIntentResponse;
  onSuccess: () => void;
}

export function BoostCheckoutPanel({ intent, onSuccess }: BoostCheckoutPanelProps) {
  const useStripeElements =
    stripePromise && !isDevClientSecret(intent.clientSecret);

  if (!useStripeElements) {
    return (
      <DevConfirmButton purchaseId={intent.purchase.id} onSuccess={onSuccess} />
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: intent.clientSecret,
        appearance: { theme: 'stripe' },
      }}
    >
      <BoostCheckoutForm purchaseId={intent.purchase.id} onSuccess={onSuccess} />
    </Elements>
  );
}
