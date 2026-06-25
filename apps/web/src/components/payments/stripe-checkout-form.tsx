'use client';

import { useState } from 'react';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import type { PaymentIntentResponse } from '@community-marketplace/types';

import { paymentsService } from '@/services/payments.service';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

async function waitForPaymentSuccess(paymentId: string, attempts = 6): Promise<boolean> {
  for (let i = 0; i < attempts; i += 1) {
    const payment = await paymentsService.getBuyerPayment(paymentId);
    if (payment?.status === 'succeeded') return true;
    if (payment?.status === 'failed') return false;
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
  return false;
}

function isDevClientSecret(clientSecret: string): boolean {
  return clientSecret.includes('_dev_') || !clientSecret.startsWith('pi_');
}

interface StripeCheckoutFormProps {
  paymentId: string;
  onSuccess: () => void;
}

function StripeCheckoutForm({ paymentId, onSuccess }: StripeCheckoutFormProps) {
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
      await paymentsService.confirmPayment(paymentId);
      const settled = await waitForPaymentSuccess(paymentId);
      if (!settled) {
        setError('Payment is processing. Check purchase history in a few seconds.');
      }
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
        {processing ? 'Processing…' : 'Pay now'}
      </button>
    </form>
  );
}

function DevConfirmButton({
  paymentId,
  onSuccess,
}: {
  paymentId: string;
  onSuccess: () => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setProcessing(true);
    setError(null);
    try {
      await paymentsService.confirmPayment(paymentId);
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
        Stripe is not configured. Use dev confirm to mark this payment as complete locally.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={() => void handleConfirm()}
        disabled={processing}
        className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {processing ? 'Confirming…' : 'Confirm payment (dev)'}
      </button>
    </div>
  );
}

interface StripeCheckoutPanelProps {
  intent: PaymentIntentResponse;
  onSuccess: () => void;
}

export function StripeCheckoutPanel({ intent, onSuccess }: StripeCheckoutPanelProps) {
  const useStripeElements =
    stripePromise && !isDevClientSecret(intent.clientSecret);

  if (!useStripeElements) {
    return <DevConfirmButton paymentId={intent.payment.id} onSuccess={onSuccess} />;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: intent.clientSecret,
        appearance: { theme: 'stripe' },
      }}
    >
      <StripeCheckoutForm paymentId={intent.payment.id} onSuccess={onSuccess} />
    </Elements>
  );
}
