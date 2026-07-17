'use client';

import { useCallback, useEffect, useState } from 'react';

import type { SellerVerificationStatus } from '@community-marketplace/types';
import { useAppFeedback } from '@community-marketplace/ui';

import { useAuth } from '@/hooks/use-auth';
import {
  dismissNudgeBanner,
  hasSeenNudgeToast,
  isNudgeBannerDismissed,
  markNudgeToastSeen,
  resolveVerificationNudge,
  type VerificationNudgeState,
} from '@/lib/verification-nudge';
import { sellerVerificationService } from '@/services/seller-verification.service';

import { VerificationBanner } from './verification-banner';
import { VerificationProgressBar } from './verification-progress-bar';

interface VerificationNudgeBannerProps {
  className?: string;
  /** Show progress bar under the banner message. */
  showProgress?: boolean;
}

export function VerificationNudgeBanner({
  className,
  showProgress = true,
}: VerificationNudgeBannerProps) {
  const { user } = useAuth();
  const [status, setStatus] = useState<SellerVerificationStatus | null>(null);
  const [nudge, setNudge] = useState<VerificationNudgeState | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    void sellerVerificationService
      .getStatus()
      .then((data) => {
        setStatus(data);
        const resolved = resolveVerificationNudge(data);
        setNudge(resolved);
        if (user?.id && resolved?.dismissible) {
          setHidden(isNudgeBannerDismissed(user.id, resolved.tier));
        }
      })
      .catch(() => {
        setStatus(null);
        setNudge(null);
      });
  }, [user?.id]);

  const handleDismiss = useCallback(() => {
    if (!user?.id || !nudge?.dismissible) return;
    dismissNudgeBanner(user.id, nudge.tier);
    setHidden(true);
  }, [nudge, user?.id]);

  if (!status || !nudge || hidden) return null;

  return (
    <VerificationBanner
      type={nudge.bannerType}
      message={nudge.message}
      className={className}
      actionHref={nudge.tier !== 'suspended' ? nudge.verifyHref : undefined}
      actionLabel={nudge.tier !== 'suspended' ? nudge.verifyLabel : undefined}
      dismissible={nudge.dismissible}
      onDismiss={nudge.dismissible ? handleDismiss : undefined}
    >
      {showProgress && nudge.showProgress && status.sellerStatus !== 'verified' ? (
        <VerificationProgressBar
          className="mt-3"
          used={status.unverifiedListingCount}
          limit={status.sellerLimit}
        />
      ) : null}
    </VerificationBanner>
  );
}

/** Mount in seller layout — shows branded app toasts for active nudge tiers. */
export function VerificationNudgeHost() {
  const { user } = useAuth();
  const { error, warning, info } = useAppFeedback();

  useEffect(() => {
    if (!user?.id) return;
    void sellerVerificationService.getStatus().then((status) => {
      const nudge = resolveVerificationNudge(status);
      if (!nudge || nudge.tier === 'none' || nudge.tier === 'verification_required') return;
      if (hasSeenNudgeToast(user.id, nudge.tier)) return;

      if (nudge.bannerType === 'critical') {
        error('Verification needed', nudge.message);
      } else if (nudge.bannerType === 'warning') {
        warning('Verification reminder', nudge.message);
      } else {
        info('SellNearby verification', nudge.message);
      }
      markNudgeToastSeen(user.id, nudge.tier);
    });
  }, [user?.id, error, warning, info]);

  return null;
}
