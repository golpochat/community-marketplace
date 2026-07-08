'use client';

import { VERIFICATION_ONBOARDING_COPY } from '@community-marketplace/types';

type VerificationOnboardingCopyProps = {
  /** @default 'learn-more' */
  variant?: 'learn-more' | 'inline';
};

export function VerificationOnboardingCopy({ variant = 'learn-more' }: VerificationOnboardingCopyProps) {
  const items = [
    VERIFICATION_ONBOARDING_COPY.PERSONAL_DETAILS_PRIVATE,
    VERIFICATION_ONBOARDING_COPY.VERIFICATION_REQUIRED,
  ];

  if (variant === 'inline') {
    return (
      <ul className="list-disc space-y-1 pl-5 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return (
    <details className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.2)] px-4 py-3">
      <summary className="cursor-pointer text-sm font-medium text-[hsl(var(--dashboard-main-fg))] marker:text-[hsl(var(--dashboard-sidebar-muted))]">
        Why we verify sellers
      </summary>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </details>
  );
}
