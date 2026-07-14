'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  REGISTRATION_SELLER_KIND_OPTIONS,
  VERIFICATION_ONBOARDING_COPY,
  type SellerRegistrationKind,
} from '@community-marketplace/types';
import { Button, Label, cn } from '@community-marketplace/ui';
import { PageHeader } from '@community-marketplace/ui-dashboard';

import { WEB_APP_ROUTES } from '@/lib/rbac-routes';
import { reloadAuthenticatedSession } from '@/lib/web-session';
import { sellerOnboardingService } from '@/services/seller-onboarding.service';

export default function StartSellingPage() {
  const router = useRouter();
  const [sellerKind, setSellerKind] = useState<SellerRegistrationKind | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!sellerKind) {
      setError('Choose how you sell: individual, sole trader, or limited company.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await sellerOnboardingService.start(sellerKind);
      await reloadAuthenticatedSession();
      router.push('/account/verification');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start seller setup');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Start selling"
        description="One account for buying and selling. Tell us how you sell — then complete verification and payouts."
      />
      <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
        {error && (
          <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">How do you sell?</legend>
          {REGISTRATION_SELLER_KIND_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-3 transition-colors duration-150',
                'hover:bg-muted/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5',
              )}
            >
              <input
                type="radio"
                name="seller-kind"
                value={option.value}
                checked={sellerKind === option.value}
                onChange={() => setSellerKind(option.value)}
                className="mt-1 accent-primary"
              />
              <span>
                <span className="block text-sm font-medium text-foreground">{option.label}</span>
                <span className="block text-xs text-muted-foreground">{option.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <p className="text-xs text-muted-foreground">{VERIFICATION_ONBOARDING_COPY.REGISTRATION_EMAIL_PRIVATE}</p>

        <Button type="submit" disabled={loading || !sellerKind} className="w-full">
          {loading ? 'Saving…' : 'Continue to seller setup'}
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={() => router.push(WEB_APP_ROUTES.account)}>
          Back to account
        </Button>
      </form>
    </>
  );
}
