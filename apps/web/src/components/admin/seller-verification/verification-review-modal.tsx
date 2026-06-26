'use client';

import { useEffect, useState } from 'react';

import type { AdminSellerVerificationDetail } from '@community-marketplace/types';
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
  onReject: (requestId: string) => void;
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
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 id="verification-review-title" className="text-lg font-semibold text-slate-900">
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
              <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-48 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-48 animate-pulse rounded-lg bg-slate-100" />
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {!loading && !error && detail ? (
            <div className="space-y-6">
              {isAlreadyVerified ? (
                <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  This seller is already verified. Use the actions below to suspend, force
                  re-verification, or view history — no approval decision is needed.
                </p>
              ) : null}
              <section>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Seller information
                </h3>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Name</dt>
                    <dd className="font-medium">{detail.sellerName ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Email</dt>
                    <dd className="font-medium">{detail.email}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Phone</dt>
                    <dd className="font-medium">{detail.phone ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Joined</dt>
                    <dd className="font-medium">{formatDateTime(detail.joinedAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Total listings</dt>
                    <dd className="font-medium">{detail.totalListings}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Seller status</dt>
                    <dd>
                      <SellerStatusBadge status={detail.sellerStatus} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Unverified listings used</dt>
                    <dd className="font-medium">
                      {detail.unverifiedListingCount}/{detail.sellerLimit}
                    </dd>
                  </div>
                </dl>
              </section>

              {canViewDocuments ? (
                <section>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
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
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Verification details
                </h3>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-slate-500">Submitted at</dt>
                    <dd>{detail.submittedAt ? formatDateTime(detail.submittedAt) : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">Verification requested at</dt>
                    <dd>
                      {detail.verificationRequestedAt
                        ? formatDateTime(detail.verificationRequestedAt)
                        : '—'}
                    </dd>
                  </div>
                  {detail.rejectionReason ? (
                    <div className="sm:col-span-2">
                      <dt className="text-slate-500">Rejection reason</dt>
                      <dd className="text-red-700">{detail.rejectionReason}</dd>
                    </div>
                  ) : null}
                </dl>
                {detail.previousAttempts.length > 0 ? (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium text-slate-700">Previous attempts</p>
                    <ul className="space-y-2 text-sm text-slate-600">
                      {detail.previousAttempts.map((attempt) => (
                        <li key={attempt.id} className="rounded-md bg-slate-50 px-3 py-2">
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {detail ? (
              <button
                type="button"
                onClick={() => onViewHistory(detail.userId, detail.sellerName)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Set listing limit
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
            {canDecide ? (
              <>
                <button
                  type="button"
                  onClick={() => onReject(pendingRequestId!)}
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
