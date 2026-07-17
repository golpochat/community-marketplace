'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { SELLER_VERIFICATION_MESSAGES } from '@community-marketplace/types';

import { SellerVerificationModal } from '@/components/seller/seller-verification-modal';
import { useSellerListingGate } from '@/hooks/use-seller-listing-gate';
import { SELLER_ROUTES } from '@/lib/seller-routes';

interface CreateListingButtonProps {
  label?: string;
  className?: string;
  disabledClassName?: string;
  /** When blocked by verification_required, redirect instead of opening modal. */
  redirectOnVerificationRequired?: boolean;
}

export function CreateListingButton({
  label = 'Create listing',
  className = 'inline-flex rounded-lg bg-[hsl(var(--dashboard-accent))] px-4 py-2 text-sm font-medium text-white hover:opacity-90',
  disabledClassName = 'inline-flex cursor-not-allowed rounded-lg bg-muted px-4 py-2 text-sm font-medium text-muted-foreground',
  redirectOnVerificationRequired = false,
}: CreateListingButtonProps) {
  const router = useRouter();
  const { blocked, tooltip, blockMessage, status, loading } = useSellerListingGate();
  const [modalOpen, setModalOpen] = useState(false);

  function handleClick() {
    if (loading || !blocked) return;

    if (
      redirectOnVerificationRequired &&
      status?.sellerStatus === 'verification_required'
    ) {
      router.push(SELLER_ROUTES.verification);
      return;
    }

    setModalOpen(true);
  }

  if (!blocked && !loading) {
    return (
      <Link href="/account/listings/create" className={className}>
        {label}
      </Link>
    );
  }

  return (
    <>
      <span title={blocked ? tooltip : undefined} className="inline-block">
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className={loading ? disabledClassName : disabledClassName}
        >
          {label}
        </button>
      </span>
      <SellerVerificationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        message={blockMessage ?? SELLER_VERIFICATION_MESSAGES.BLOCK_VERIFICATION_REQUIRED}
        dismissible={false}
      />
    </>
  );
}
