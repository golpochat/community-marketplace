export { DashboardLayout } from './components/dashboard-layout';
export type { DashboardLayoutProps } from './components/dashboard-layout';
export { DashboardLayout as UnifiedDashboardLayout } from './layouts/DashboardLayout';

export { DashboardSidebar } from './components/dashboard-sidebar';
export type { DashboardSidebarProps } from './components/dashboard-sidebar';

export { DashboardTopbar } from './components/dashboard-topbar';
export type { DashboardTopbarProps } from './components/dashboard-topbar';

export { FooterBar } from './components/footer-bar';
export type { FooterBarProps } from './components/footer-bar';

export { PageHeader } from './components/page-header';
export type { PageHeaderProps } from './components/page-header';

export { DashboardCard } from './components/dashboard-card';
export type { DashboardCardProps } from './components/dashboard-card';

export { ProfileDropdown } from './components/profile-dropdown';
export type { ProfileDropdownProps, ProfileDropdownUser } from './components/profile-dropdown';

export { SidebarItem } from './components/sidebar-item';
export type { SidebarItemProps } from './components/sidebar-item';

export { DashboardThemeProvider } from './components/theme-provider';
export type { DashboardThemeProviderProps } from './components/theme-provider';

export { Icon, DASHBOARD_ICONS } from './components/icon';
export type { IconProps, DashboardIconName } from './components/icon';

export { DashboardPagePlaceholder } from './components/dashboard-page-placeholder';
export type { DashboardPagePlaceholderProps } from './components/dashboard-page-placeholder';

export {
  getDashboardRouteByRole,
  getSidebarItemsByRole,
} from './lib/routes';
export type { SidebarNavItem } from './lib/sidebar-config';

export {
  SUPER_ADMIN_SIDEBAR,
  ADMIN_SIDEBAR,
  SELLER_SIDEBAR,
  BUYER_SIDEBAR,
} from './lib/sidebar-config';

export {
  getThemeByRole,
  getThemeClassName,
  resolveDashboardThemeAttribute,
  superAdminTheme,
  adminTheme,
  sellerTheme,
  buyerTheme,
  resolveThemeToken,
  getThemeDefinition,
} from './lib/themes';
export type {
  DashboardTheme,
  DashboardThemeId,
  DashboardThemeVariant,
  DashboardThemeProp,
  DashboardThemeToken,
  RoleThemeDefinition,
} from './lib/themes';

export { PageTitleProvider, usePageTitle } from './lib/page-title-context';
export { SidebarProvider, useSidebar } from './lib/sidebar-context';

export {
  getRoleRoutePrefix,
  isAdminDashboardRole,
  isWebDashboardRole,
  getRequiredRoleForPath,
  isDashboardRouteAllowed,
  getUnauthorizedRedirectPath,
} from './lib/guards';
