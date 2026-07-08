'use client';

import { BadgeCheck, CircleDashed } from 'lucide-react';

import type { SellerVerificationStatus } from '@community-marketplace/types';

import { SellerProfileStatusBadge } from '@/components/seller/profile/seller-profile-status-badge';

type ChecklistTone = 'verified' | 'required' | 'pending' | 'review';

const CHECKLIST_TONE_STYLES: Record<
  ChecklistTone,
  { label: string; className: string; showCheck: boolean }
> = {
  verified: {
    label: 'Verified',
    className: 'bg-emerald-50 text-emerald-900 ring-emerald-200',
    showCheck: true,
  },
  required: {
    label: 'Required',
    className: 'bg-amber-50 text-amber-900 ring-amber-200',
    showCheck: false,
  },
  pending: {
    label: 'Pending',
    className: 'bg-[hsl(var(--dashboard-sidebar-active)/0.5)] text-[hsl(var(--dashboard-sidebar-muted))] ring-[hsl(var(--dashboard-sidebar-border))]',
    showCheck: false,
  },
  review: {
    label: 'Under review',
    className: 'bg-sky-50 text-sky-900 ring-sky-200',
    showCheck: false,
  },
};

function VerificationChecklistPill({ tone }: { tone: ChecklistTone }) {
  const config = CHECKLIST_TONE_STYLES[tone];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${config.className}`}
    >
      {config.showCheck ? <BadgeCheck className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
      {!config.showCheck && tone === 'pending' ? (
        <CircleDashed className="h-3.5 w-3.5 shrink-0" aria-hidden />
      ) : null}
      {config.label}
    </span>
  );
}

function ChecklistRow({
  label,
  description,
  tone,
  children,
}: {
  label: string;
  description?: string;
  tone?: ChecklistTone;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[hsl(var(--dashboard-sidebar-border))] px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-[hsl(var(--dashboard-sidebar-muted))]">{description}</p>
        ) : null}
      </div>
      <div className="shrink-0">{children ?? (tone ? <VerificationChecklistPill tone={tone} /> : null)}</div>
    </div>
  );
}

function resolveIdentityTone(status: SellerVerificationStatus): ChecklistTone {
  if (status.idVerified) return 'verified';
  if (status.sellerStatus === 'under_review' || status.verificationRequestedAt) return 'review';
  if (status.pendingRequest?.idDocumentPath) return 'pending';
  return 'required';
}

export function VerificationChecklist({ status }: { status: SellerVerificationStatus }) {
  const personalDetailsTone: ChecklistTone = status.personalDetailsComplete ? 'verified' : 'required';

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] bg-[hsl(var(--dashboard-sidebar-active)/0.15)]">
      <ChecklistRow label="Account status">
        <SellerProfileStatusBadge status={status.sellerStatus} />
      </ChecklistRow>
      <ChecklistRow
        label="Email"
        description="Used for account security and updates"
        tone={status.emailVerified ? 'verified' : 'required'}
      />
      <ChecklistRow
        label="Phone"
        description="Used for sign-in and buyer contact"
        tone={status.phoneVerified ? 'verified' : 'required'}
      />
      <ChecklistRow
        label="Legal identity"
        description="Private name that matches your ID"
        tone={personalDetailsTone}
      />
      <ChecklistRow
        label="Identity documents"
        description="Government ID and selfie for review"
        tone={resolveIdentityTone(status)}
      />
    </div>
  );
}
