'use client';

import { STRIPE_CONNECT_BRANDING } from '@community-marketplace/config';
import { ShieldCheck } from 'lucide-react';

import { Logo } from '@/components/brand/logo';

interface StripeConnectOnboardingPanelProps {
  connectStarted: boolean;
  onboarding: boolean;
  onContinue: () => void;
}

const SETUP_STEPS = [
  'Confirm your contact details',
  'Verify your identity (required by Stripe)',
  'Link your Irish bank account for payouts',
] as const;

export function StripeConnectOnboardingPanel({
  connectStarted,
  onboarding,
  onContinue,
}: StripeConnectOnboardingPanelProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-brand-sm">
      <div className="bg-gradient-to-br from-primary to-primary/80 px-5 py-6 text-primary-foreground sm:px-6">
        <div className="flex items-center gap-3">
          <Logo variant="light" size="footer" linked={false} />
        </div>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-primary-foreground/90">
          {STRIPE_CONNECT_BRANDING.partnerLine}
        </p>
      </div>

      <div className="space-y-5 px-5 py-6 sm:px-6">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {connectStarted ? 'Finish payout setup' : 'Set up payouts'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;ll complete a short secure form on Stripe. Buyers cannot pay for your listings
            until charges and payouts are enabled.
          </p>
        </div>

        <ol className="space-y-2">
          {SETUP_STEPS.map((step, index) => (
            <li key={step} className="flex items-start gap-3 text-sm text-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <span className="pt-0.5">{step}</span>
            </li>
          ))}
        </ol>

        <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-3 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <p>
            Stripe handles identity checks and bank details. {STRIPE_CONNECT_BRANDING.platformName}{' '}
            never stores your IBAN or government ID. In test mode, use Stripe&apos;s test phone and
            business details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onContinue}
            disabled={onboarding}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {onboarding
              ? 'Opening secure setup…'
              : connectStarted
                ? 'Continue on Stripe'
                : 'Continue to secure setup'}
          </button>
          <p className="text-xs text-muted-foreground">
            Powered by{' '}
            <span className="font-medium text-foreground">Stripe</span>
            {' · '}
            You can return to {STRIPE_CONNECT_BRANDING.platformName} when finished
          </p>
        </div>
      </div>
    </div>
  );
}
