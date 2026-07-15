import type { AccountSellingPhase } from '@community-marketplace/types';
import { ACCOUNT_SIDEBAR, type SidebarNavItem } from '@community-marketplace/ui-dashboard';

import { WEB_APP_ROUTES } from '@/lib/rbac-routes';

const SELLING_SECTION: SidebarNavItem = {
  id: 'section-selling',
  label: 'Selling',
  sectionHeader: true,
};

function sellingNavItems(phase: AccountSellingPhase): SidebarNavItem[] {
  switch (phase) {
    case 'buyer_only':
      return [
        SELLING_SECTION,
        {
          id: 'start-selling',
          label: 'Start selling',
          href: WEB_APP_ROUTES.accountSelling,
          icon: 'plus',
        },
      ];
    case 'setup_in_progress':
      return [
        SELLING_SECTION,
        {
          id: 'seller-setup',
          label: 'Continue setup',
          href: WEB_APP_ROUTES.accountSelling,
          icon: 'hammer',
        },
      ];
    case 'suspended':
      return [
        SELLING_SECTION,
        {
          id: 'seller-setup',
          label: 'Seller account',
          href: WEB_APP_ROUTES.accountSelling,
          icon: 'ban',
        },
      ];
    case 'active_seller':
      return [
        SELLING_SECTION,
        {
          id: 'my-listings',
          label: 'My listings',
          href: WEB_APP_ROUTES.accountListings,
          icon: 'tag',
        },
        {
          id: 'create-listing',
          label: 'Create listing',
          href: '/account/listings/create',
          icon: 'plus',
        },
        {
          id: 'earnings',
          label: 'Earnings',
          href: WEB_APP_ROUTES.accountEarnings,
          icon: 'wallet',
        },
      ];
  }
}

/** Buyer-first sidebar with a single selling section driven by onboarding phase. */
export function buildAccountSidebarItems(phase: AccountSellingPhase): SidebarNavItem[] {
  const messagesIndex = ACCOUNT_SIDEBAR.findIndex((item) => item.id === 'messages');
  const splitAt = messagesIndex === -1 ? ACCOUNT_SIDEBAR.length : messagesIndex;
  const base = ACCOUNT_SIDEBAR.slice(0, splitAt);
  const tail = ACCOUNT_SIDEBAR.slice(splitAt);

  return [...base, ...sellingNavItems(phase), ...tail];
}
