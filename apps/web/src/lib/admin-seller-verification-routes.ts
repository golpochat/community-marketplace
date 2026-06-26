import type { AdminSellerVerificationView } from '@community-marketplace/types';

export type AdminSellerVerificationRouteView = AdminSellerVerificationView | 'history';

export const ADMIN_SELLER_VERIFICATION_VIEWS: Record<
  string,
  AdminSellerVerificationRouteView
> = {
  pending: 'pending',
  'under-review': 'under_review',
  approved: 'approved',
  rejected: 'rejected',
  suspended: 'suspended',
  history: 'history',
};

export const ADMIN_SELLER_VERIFICATION_VIEW_LABELS: Record<
  AdminSellerVerificationRouteView,
  string
> = {
  pending: 'Pending Requests',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended Sellers',
  history: 'Status History',
};

export function resolveSellerVerificationView(
  segment: string,
): AdminSellerVerificationRouteView | null {
  return ADMIN_SELLER_VERIFICATION_VIEWS[segment] ?? null;
}
