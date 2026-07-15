'use client';

import { useEffect, useState } from 'react';

import type { AdminSellerVerificationDetail } from '@community-marketplace/types';
import { formatFastTrackSlaLabel } from '@community-marketplace/types';
import { formatDateTime } from '@community-marketplace/utils';

import { DocumentPreview } from '@/components/admin/seller-verification/document-preview';
import { SellerStatusBadge } from '@/components/admin/seller-verification/seller-status-badge';
import {
  adminSellerVerificationService,
  type AdminServiceRole,
} from '@/services/admin-seller-verification.service';

interface VerificationReviewModalProps {
  open: boolean;
  role: AdminServiceRole;
  requestId?: string;
  userId?: string;
  canViewDocuments: boolean;
  canReview: boolean;
  canSuspend: boolean;
  canReactivate: boolean;
  canForceReverify: boolean;
  canManageLimits: boolean;
  onClose: () => void;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string, options?: { isFastTrack?: boolean }) => void;
  onSuspend: (detail: AdminSellerVerificationDetail) => void;
  onReactivate: (detail: AdminSellerVerificationDetail) => void;
  onForceReverify: (detail: AdminSellerVerificationDetail) => void;
  onSetLimit: (detail: AdminSellerVerificationDetail) => void;
  onViewHistory: (userId: string, sellerName?: string) => void;
}

export function VerificationReviewModal({
  open,
  role,
  requestId,
  userId,
  canViewDocuments,
  canReview,
  canSuspend,
  canReactivate,
  canForceReverify,
  canManageLimits,
  onClose,
  onApprove,
  onReject,
  onSuspend,
  onReactivate,
  onForceReverify,
  onSetLimit,
  onViewHistory,
}: VerificationReviewModalProps) {
  const [detail, setDetail] = useState<AdminSellerVerificationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDetail(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const load = requestId
      ? adminSellerVerificationService.getRequestDetail(role, requestId)
      : userId
        ? adminSellerVerificationService.getSellerDetail(role, userId)
        : Promise.reject(new Error('Missing seller reference'));

    void load
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, requestId, userId, role]);

  if (!open) return null;

  const sellerLabel = detail?.sellerName ?? detail?.email ?? 'Seller';
  const pendingRequestId = detail?.requestId;
  const isAlreadyVerified = detail?.sellerStatus === 'verified';
  const canDecide =
    canReview &&
    !!pendingRequestId &&
    detail?.requestStatus === 'pending' &&
    !isAlreadyVerified;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verification-review-title"
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-[hsl(var(--dashboard-topbar-bg))] shadow-xl">
        <div className="border-b border-[hsl(var(--dashboard-sidebar-border))] px-6 py-4">
          <h2 id="verification-review-title" className="text-lg font-semibold text-[hsl(var(--dashboard-main-fg))]">
            {isAlreadyVerified
              ? `Verified seller – ${sellerLabel}`
              : canDecide
                ? `Verification request – ${sellerLabel}`
                : `Seller verification – ${sellerLabel}`}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="space-y-4">
              <div className="h-24 animate-pulse rounded-lg bg-[hsl(var(--dashboard-sidebar-active)/0.5)]" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-48 animate-pulse rounded-lg bg-[hsl(var(--dashboard-sidebar-active)/0.5)]" />
                <div className="h-48 animate-pulse rounded-lg bg-[hsl(var(--dashboard-sidebar-active)/0.5)]" />
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          {!loading && !error && detail ? (
            <div className="space-y-6">
              {isAlreadyVerified ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  This seller is already verified. Use the actions below to suspend, force
                  re-verification, or view history — no approval decision is needed.
                </p>
              ) : null}
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
                  Seller information
                </h3>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Public name</dt>
                    <dd className="font-medium">{detail.sellerName ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Legal name (private)</dt>
                    <dd className="font-medium">{detail.legalName ?? '—'}</dd>
                  </div>
                  {detail.isBusinessAccount ? (
                    <>
                      <div>
                        <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Business type</dt>
                        <dd className="font-medium">{detail.businessStructure ?? '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Business name</dt>
                        <dd className="font-medium">{detail.businessName ?? '—'}</dd>
                      </div>
                      {detail.registeredCompanyName ? (
                        <div>
                          <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Registered company</dt>
                          <dd className="font-medium">{detail.registeredCompanyName}</dd>
                        </div>
                      ) : null}
                      {detail.croNumber ? (
                        <div>
                          <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">CRO number</dt>
                          <dd className="font-medium">{detail.croNumber}</dd>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                  <div>
                    <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Email</dt>
                    <dd className="font-medium">{detail.email}</dd>
                  </div>
                  <div>
                    <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Phone</dt>
                    <dd className="font-medium">{detail.phone ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Joined</dt>
                    <dd className="font-medium">{formatDateTime(detail.joinedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Total listings</dt>
                    <dd className="font-medium">{detail.totalListings}</dd>
                  </div>
                  <div>
                    <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Seller status</dt>
                    <dd>
                      <SellerStatusBadge status={detail.sellerStatus} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Unverified listings used</dt>
                    <dd className="font-medium">
                      {detail.unverifiedListingCount}/{detail.sellerLimit}
                    </dd>
                  </div>
                  {detail.priority ? (
                    <>
                      <div>
                        <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Review track</dt>
                        <dd className="font-medium text-indigo-900">Fast-track (priority)</dd>
                      </div>
                      {detail.priorityActivatedAt ? (
                        <div>
                          <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Priority since</dt>
                          <dd className="font-medium">{formatDateTime(detail.priorityActivatedAt)}</dd>
                        </div>
                      ) : null}
                      {detail.reviewDueAt ? (
                        <div>
                          <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">SLA target</dt>
                          <dd className="font-medium">
                            {formatDateTime(detail.reviewDueAt)} (
                            {formatFastTrackSlaLabel(detail.reviewDueAt)})
                          </dd>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div>
                      <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Review track</dt>
                      <dd className="font-medium">Standard</dd>
                    </div>
                  )}
                </dl>
              </section>

              {canViewDocuments ? (
                <section>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
                    Uploaded documents
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <DocumentPreview label="ID document" url={detail.idDocumentPath} />
                    <DocumentPreview label="Selfie" url={detail.selfiePath} />
                    <DocumentPreview label="Address proof" url={detail.addressDocumentPath} />
                  </div>
                </section>
              ) : (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Insufficient permissions to view seller documents.
                </p>
              )}

              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[hsl(var(--dashboard-sidebar-muted))]">
                  Verification details
                </h3>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Submitted at</dt>
                    <dd>{detail.submittedAt ? formatDateTime(detail.submittedAt) : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Verification requested at</dt>
                    <dd>
                      {detail.verificationRequestedAt
                        ? formatDateTime(detail.verificationRequestedAt)
                        : '—'}
                    </dd>
                  </div>
                  {detail.rejectionReason ? (
                    <div className="sm:col-span-2">
                      <dt className="text-[hsl(var(--dashboard-sidebar-muted))]">Rejection reason</dt>
                      <dd className="text-red-700">{detail.rejectionReason}</dd>
                    </div>
                  ) : null}
                </dl>
                {detail.previousAttempts.length > 0 ? (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))]">Previous attempts</p>
                    <ul className="space-y-2 text-sm text-[hsl(var(--dashboard-sidebar-muted))]">
                      {detail.previousAttempts.map((attempt) => (
                        <li key={attempt.id} className="rounded-md bg-[hsl(var(--dashboard-sidebar-active)/0.35)] px-3 py-2">
                          {formatDateTime(attempt.createdAt)} — {attempt.status}
                          {attempt.rejectionReason ? ` (${attempt.rejectionReason})` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[hsl(var(--dashboard-sidebar-border))] px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {detail ? (
              <button
                type="button"
                onClick={() => onViewHistory(detail.userId, detail.sellerName)}
                className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)]"
              >
                Status history
              </button>
            ) : null}
            {detail && canSuspend && detail.sellerStatus !== 'suspended' ? (
              <button
                type="button"
                onClick={() => onSuspend(detail)}
                className="rounded-lg border border-rose-300 px-3 py-2 text-sm font-medium text-rose-800 hover:bg-rose-50"
              >
                Suspend seller
              </button>
            ) : null}
            {detail && canReactivate && detail.sellerStatus === 'suspended' ? (
              <button
                type="button"
                onClick={() => onReactivate(detail)}
                className="rounded-lg border border-emerald-300 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
              >
                Reactivate seller
              </button>
            ) : null}
            {detail && canForceReverify && detail.sellerStatus !== 'suspended' ? (
              <button
                type="button"
                onClick={() => onForceReverify(detail)}
                className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50"
              >
                Force re-verification
              </button>
            ) : null}
            {detail && canManageLimits ? (
              <button
                type="button"
                onClick={() => onSetLimit(detail)}
                className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-3 py-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)]"
              >
                Set listing limit
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[hsl(var(--dashboard-sidebar-border))] px-4 py-2 text-sm font-medium text-[hsl(var(--dashboard-main-fg))] hover:bg-[hsl(var(--dashboard-sidebar-active)/0.35)]"
            >
              Close
            </button>
            {canDecide ? (
              <>
                <button
                  type="button"
                  onClick={() =>
                    onReject(pendingRequestId!, { isFastTrack: Boolean(detail?.priority) })
                  }
                  className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Reject verification
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(pendingRequestId!)}
                  className="rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Approve verification
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
