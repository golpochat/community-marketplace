'use client';

import { VERIFICATION_ONBOARDING_COPY } from '@community-marketplace/types';

type VerificationOnboardingCopyProps = {
  variant?: 'default' | 'compact';
  showFastTrack?: boolean;
};

export function VerificationOnboardingCopy({
  variant = 'default',
  showFastTrack = true,
}: VerificationOnboardingCopyProps) {
  const items = [
    VERIFICATION_ONBOARDING_COPY.PERSONAL_DETAILS_PRIVATE,
    VERIFICATION_ONBOARDING_COPY.VERIFICATION_REQUIRED,
    ...(showFastTrack ? [VERIFICATION_ONBOARDING_COPY.FAST_TRACK_EXPLAINER] : []),
  ];

  if (variant === 'compact') {
    return (
      <p className="text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
        {items.join(' ')}
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.25)] p-4">
      <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">
        Why we verify sellers
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
