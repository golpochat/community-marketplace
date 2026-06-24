import type { DashboardIconName } from '../components/icon';

export interface SidebarNavItem {
  id: string;
  label: string;
  href: string;
  icon: DashboardIconName;
  exact?: boolean;
}

export const SUPER_ADMIN_SIDEBAR: SidebarNavItem[] = [
  { id: 'overview', label: 'Overview', href: '/super-admin/dashboard', icon: 'crown', exact: true },
  { id: 'users', label: 'Users', href: '/super-admin/users', icon: 'shield' },
  { id: 'admins', label: 'Admins', href: '/super-admin/admins', icon: 'key' },
  { id: 'listings', label: 'Listings', href: '/super-admin/listings', icon: 'folder' },
  { id: 'payments', label: 'Payments', href: '/super-admin/payments', icon: 'landmark' },
  { id: 'moderation', label: 'Moderation', href: '/super-admin/moderation', icon: 'hammer' },
  { id: 'search', label: 'Search System', href: '/super-admin/search', icon: 'search' },
  { id: 'notifications', label: 'Notifications', href: '/super-admin/notifications', icon: 'radio' },
  { id: 'settings', label: 'System Settings', href: '/super-admin/settings', icon: 'settings' },
  { id: 'audit-logs', label: 'Audit Logs', href: '/super-admin/audit-logs', icon: 'scroll' },
  { id: 'rbac', label: 'RBAC', href: '/super-admin/rbac', icon: 'user-cog' },
];

export const ADMIN_SIDEBAR: SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: 'bar-chart', exact: true },
  { id: 'users', label: 'Users', href: '/admin/users', icon: 'users' },
  { id: 'listings', label: 'Listings', href: '/admin/listings', icon: 'folder' },
  { id: 'reports', label: 'Reports', href: '/admin/reports', icon: 'flag' },
  { id: 'moderation', label: 'Moderation', href: '/admin/moderation', icon: 'scale' },
  { id: 'payments', label: 'Payments', href: '/admin/payments', icon: 'credit-card' },
  { id: 'search', label: 'Search Tools', href: '/admin/search', icon: 'compass' },
  { id: 'notifications', label: 'Notifications', href: '/admin/notifications', icon: 'bell' },
  { id: 'settings', label: 'Settings', href: '/admin/settings', icon: 'settings' },
];

export const SELLER_SIDEBAR: SidebarNavItem[] = [
  { id: 'home', label: 'Home', href: '/seller/dashboard', icon: 'home', exact: true },
  { id: 'listings', label: 'My Listings', href: '/seller/listings', icon: 'tag' },
  { id: 'create', label: 'Create Listing', href: '/seller/listings/create', icon: 'plus' },
  { id: 'sales', label: 'Sales', href: '/seller/sales', icon: 'shopping-cart' },
  { id: 'earnings', label: 'Earnings', href: '/seller/earnings', icon: 'wallet' },
  { id: 'chat', label: 'Chat', href: '/seller/chat', icon: 'message-circle' },
  { id: 'verification', label: 'Verification', href: '/seller/verification', icon: 'medal' },
  { id: 'notifications', label: 'Notifications', href: '/seller/notifications', icon: 'bell' },
  { id: 'settings', label: 'Settings', href: '/seller/settings', icon: 'settings' },
];

export const BUYER_SIDEBAR: SidebarNavItem[] = [
  { id: 'home', label: 'Home', href: '/buyer/dashboard', icon: 'home', exact: true },
  { id: 'listings', label: 'Browse Listings', href: '/buyer/listings', icon: 'search' },
  { id: 'favorites', label: 'Favorites', href: '/buyer/favorites', icon: 'heart' },
  { id: 'purchases', label: 'Purchases', href: '/buyer/purchases', icon: 'package' },
  { id: 'chat', label: 'Chat', href: '/buyer/chat', icon: 'message-circle' },
  { id: 'notifications', label: 'Notifications', href: '/buyer/notifications', icon: 'bell' },
  { id: 'settings', label: 'Settings', href: '/buyer/settings', icon: 'settings' },
];
