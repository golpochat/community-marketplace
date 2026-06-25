'use client';

import type { Listing, ListingPackageType, ListingStatus } from '@community-marketplace/types';
import { IconActionButton, IconActionGroup } from '@community-marketplace/ui-dashboard';

interface ListingSellerActionsProps {
  listing: Listing;
  actionId: string | null;
  onAction: (listingId: string, action: SellerListingAction) => void;
}

export type SellerListingAction =
  | 'edit'
  | 'submit'
  | 'publish'
  | 'cancel-review'
  | 'pause'
  | 'resume'
  | 'sold'
  | 'end'
  | 'renew'
  | 'upgrade'
  | 'duplicate'
  | 'delete';

export function ListingSellerActions({ listing, actionId, onAction }: ListingSellerActionsProps) {
  const busy = actionId === listing.id;
  const status = listing.status as ListingStatus;

  const editButton = (
    <IconActionButton
      key="edit"
      icon="pencil"
      label="Edit listing"
      variant="accent"
      href={`/seller/listings/${listing.id}/edit`}
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
        <IconActionButton
          key="publish"
          icon="check"
          label="Publish now"
          disabled={busy}
          onClick={() => onAction(listing.id, 'publish')}
        />,
      );
      break;
    case 'pending_review':
      actions.push(
        <IconActionButton
          key="view"
          icon="eye"
          label="View listing"
          href={`/seller/listings/${listing.id}/edit`}
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
      actions.push(
        <IconActionButton
          key="upgrade"
          icon="check"
          label="Upgrade package"
          disabled={busy}
          onClick={() => onAction(listing.id, 'upgrade')}
        />,
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
        <IconActionButton
          key="duplicate"
          icon="plus"
          label="Duplicate listing"
          disabled={busy}
          onClick={() => onAction(listing.id, 'duplicate')}
        />,
      );
      break;
    case 'sold':
    case 'ended':
      actions.push(
        <IconActionButton
          key="duplicate"
          icon="plus"
          label="Duplicate listing"
          disabled={busy}
          onClick={() => onAction(listing.id, 'duplicate')}
        />,
      );
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
