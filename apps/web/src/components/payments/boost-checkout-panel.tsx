'use client';

import { useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import { monetizationService } from '@/services/monetization.service';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

function isDevClientSecret(clientSecret: string): boolean {
  return clientSecret.includes('_dev_') || !clientSecret.startsWith('pi_');
}

function BoostCheckoutForm({
  purchaseId,
  onSuccess,
  confirmPurchase,
  confirmLabel = 'Pay and boost',
}: {
  purchaseId: string;
  onSuccess: () => void;
  confirmPurchase: (purchaseId: string) => Promise<unknown>;
  confirmLabel?: string;
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
      await confirmPurchase(purchaseId);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm payment');
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
        {processing ? 'Processing…' : confirmLabel}
      </button>
    </form>
  );
}

function DevConfirmButton({
  purchaseId,
  onSuccess,
  confirmPurchase,
  confirmLabel = 'Confirm boost (dev)',
}: {
  purchaseId: string;
  onSuccess: () => void;
  confirmPurchase: (purchaseId: string) => Promise<unknown>;
  confirmLabel?: string;
}) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setProcessing(true);
    setError(null);
    try {
      await confirmPurchase(purchaseId);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm payment');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">
        Stripe is not configured. Use dev confirm to activate locally.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={() => void handleConfirm()}
        disabled={processing}
        className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {processing ? 'Confirming…' : confirmLabel}
      </button>
    </div>
  );
}

interface BoostCheckoutPanelProps {
  intent: {
    purchase: { id: string };
    clientSecret: string | null;
    creditsApplied?: number;
    amountDue?: number;
  };
  onSuccess: () => void;
  confirmPurchase?: (purchaseId: string) => Promise<unknown>;
  confirmLabel?: string;
}

export function BoostCheckoutPanel({
  intent,
  onSuccess,
  confirmPurchase = monetizationService.confirmBoost,
  confirmLabel,
}: BoostCheckoutPanelProps) {
  const creditsOnly = !intent.clientSecret || (intent.amountDue != null && intent.amountDue <= 0);

  if (creditsOnly) {
    return (
      <div className="space-y-3">
        {intent.creditsApplied != null && intent.creditsApplied > 0 && (
          <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
            Paid with €{intent.creditsApplied.toFixed(2)} SellNearby Credit. No card charge.
          </p>
        )}
        <button
          type="button"
          onClick={onSuccess}
          className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Done
        </button>
      </div>
    );
  }

  const clientSecret = intent.clientSecret!;
  const useStripeElements = Boolean(stripePromise && !isDevClientSecret(clientSecret));
  const creditHint =
    intent.creditsApplied != null && intent.creditsApplied > 0
      ? `Applying €${intent.creditsApplied.toFixed(2)} credit` +
        (intent.amountDue != null ? ` · card due €${intent.amountDue.toFixed(2)}` : '')
      : null;

  if (!useStripeElements) {
    return (
      <div className="space-y-3">
        {creditHint && (
          <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{creditHint}</p>
        )}
        <DevConfirmButton
          purchaseId={intent.purchase.id}
          onSuccess={onSuccess}
          confirmPurchase={confirmPurchase}
          confirmLabel={confirmLabel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {creditHint && (
        <p className="text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{creditHint}</p>
      )}
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: { theme: 'stripe' },
        }}
      >
        <BoostCheckoutForm
          purchaseId={intent.purchase.id}
          onSuccess={onSuccess}
          confirmPurchase={confirmPurchase}
          confirmLabel={confirmLabel}
        />
      </Elements>
    </div>
  );
}
