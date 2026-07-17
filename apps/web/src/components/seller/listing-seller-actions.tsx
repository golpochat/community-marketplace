'use client';

import type { Listing, ListingPackageType, ListingStatus } from '@community-marketplace/types';
import { IconActionButton, IconActionGroup } from '@community-marketplace/ui-dashboard';

interface ListingSellerActionsProps {
  listing: Listing;
  actionId: string | null;
  onAction: (listingId: string, action: SellerListingAction) => void;
  /** When true, all listing actions are disabled (suspended seller). */
  listingActionsBlocked?: boolean;
  listingActionsBlockedReason?: string;
  /** When true, duplicate is disabled (unverified limit reached). */
  duplicateBlocked?: boolean;
  duplicateBlockedReason?: string;
  /** When false, paid boost and feature actions are hidden. */
  sellerVerified?: boolean;
}

export type SellerListingAction =
  | 'edit'
  | 'submit'
  | 'cancel-review'
  | 'pause'
  | 'resume'
  | 'sold'
  | 'end'
  | 'renew'
  | 'upgrade'
  | 'feature'
  | 'duplicate'
  | 'delete';

export function ListingSellerActions({
  listing,
  actionId,
  onAction,
  listingActionsBlocked = false,
  listingActionsBlockedReason,
  duplicateBlocked = false,
  duplicateBlockedReason,
  sellerVerified = true,
}: ListingSellerActionsProps) {
  const busy = actionId === listing.id;
  const status = listing.status as ListingStatus;

  if (listingActionsBlocked) {
    return (
      <p className="text-xs text-red-600" title={listingActionsBlockedReason}>
        Listing actions unavailable
      </p>
    );
  }

  const duplicateButton = (key: string) => (
    <span key={key} title={duplicateBlocked ? duplicateBlockedReason : undefined}>
      <IconActionButton
        icon="plus"
        label="Duplicate listing"
        disabled={busy || duplicateBlocked}
        onClick={() => onAction(listing.id, 'duplicate')}
      />
    </span>
  );

  const editButton = (
    <IconActionButton
      key="edit"
      icon="pencil"
      label="Edit listing"
      variant="accent"
      href={`/account/listings/${listing.id}/edit`}
    />
  );

  const actions: React.ReactNode[] = [];

  switch (status) {
    case 'draft':
      actions.push(editButton);
      actions.push(
        <IconActionButton
          key="submit"
          icon="eye"
          label="Submit for review"
          disabled={busy}
          onClick={() => onAction(listing.id, 'submit')}
        />,
      );
      break;
    case 'pending_review':
      actions.push(
        <IconActionButton
          key="view"
          icon="eye"
          label="View listing"
          href={`/account/listings/${listing.id}/edit`}
        />,
        <IconActionButton
          key="cancel"
          icon="x"
          label="Cancel review"
          disabled={busy}
          onClick={() => onAction(listing.id, 'cancel-review')}
        />,
      );
      break;
    case 'active':
      actions.push(editButton);
      if (sellerVerified) {
        actions.push(
          <IconActionButton
            key="upgrade"
            icon="check"
            label="Boost listing"
            disabled={busy}
            onClick={() => onAction(listing.id, 'upgrade')}
          />,
          <IconActionButton
            key="feature"
            icon="medal"
            label="Feature listing"
            disabled={busy}
            onClick={() => onAction(listing.id, 'feature')}
          />,
        );
      }
      actions.push(
        <IconActionButton
          key="pause"
          icon="archive"
          label="Pause listing"
          disabled={busy}
          onClick={() => onAction(listing.id, 'pause')}
        />,
        <IconActionButton
          key="sold"
          icon="circle-check"
          label="Mark as sold"
          disabled={busy}
          onClick={() => onAction(listing.id, 'sold')}
        />,
        <IconActionButton
          key="end"
          icon="x"
          label="End listing"
          disabled={busy}
          onClick={() => onAction(listing.id, 'end')}
        />,
      );
      break;
    case 'paused':
      actions.push(editButton);
      actions.push(
        <IconActionButton
          key="resume"
          icon="check"
          label="Resume listing"
          disabled={busy}
          onClick={() => onAction(listing.id, 'resume')}
        />,
        <IconActionButton
          key="sold"
          icon="circle-check"
          label="Mark as sold"
          disabled={busy}
          onClick={() => onAction(listing.id, 'sold')}
        />,
        <IconActionButton
          key="end"
          icon="x"
          label="End listing"
          disabled={busy}
          onClick={() => onAction(listing.id, 'end')}
        />,
      );
      break;
    case 'expired':
      actions.push(editButton);
      actions.push(
        <IconActionButton
          key="renew"
          icon="check"
          label="Renew listing"
          disabled={busy}
          onClick={() => onAction(listing.id, 'renew')}
        />,
        duplicateButton('duplicate'),
      );
      break;
    case 'sold':
    case 'ended':
      actions.push(duplicateButton('duplicate'));
      break;
    case 'rejected':
      actions.push(editButton);
      actions.push(
        <IconActionButton
          key="resubmit"
          icon="eye"
          label="Edit and resubmit"
          disabled={busy}
          onClick={() => onAction(listing.id, 'submit')}
        />,
      );
      break;
    case 'flagged':
    case 'under_investigation':
      actions.push(
        <IconActionButton
          key="view"
          icon="eye"
          label="View listing"
          href={`/account/listings/${listing.id}/edit`}
        />,
      );
      break;
    case 'suspended_seller':
      break;
    case 'removed':
      break;
    default:
      actions.push(editButton);
  }

  if (status !== 'removed' && status !== 'sold' && status !== 'ended') {
    actions.push(
      <IconActionButton
        key="delete"
        icon="trash"
        label="Delete listing"
        variant="danger"
        disabled={busy}
        onClick={() => onAction(listing.id, 'delete')}
      />,
    );
  }

  return <IconActionGroup>{actions}</IconActionGroup>;
}

export const DEFAULT_RENEW_PACKAGE: ListingPackageType = 'FREE';
