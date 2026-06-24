export { DashboardLayout, default as defaultDashboardLayout } from './layouts/DashboardLayout';
export type { DashboardLayoutProps } from './layouts/DashboardLayout';

export { Sidebar, DashboardSidebar } from './sidebar/Sidebar';
export type { SidebarProps, DashboardSidebarProps } from './sidebar/Sidebar';

export { SidebarItem } from './sidebar/SidebarItem';
export type { SidebarItemProps } from './sidebar/SidebarItem';

export { Topbar, DashboardTopbar } from './topbar/Topbar';
export type { TopbarProps, DashboardTopbarProps } from './topbar/Topbar';

export { FooterBar } from './footer/FooterBar';
export type { FooterBarProps } from './footer/FooterBar';

export { ThemeProvider, DashboardThemeProvider } from './theme/ThemeProvider';
export type { DashboardThemeProviderProps } from './theme/ThemeProvider';

export {
  superAdminTheme,
  adminTheme,
  sellerTheme,
  buyerTheme,
  resolveThemeToken,
  getThemeDefinition,
  getThemeByRole,
  getThemeClassName,
  resolveDashboardThemeAttribute,
} from './theme/theme-tokens';
export type {
  DashboardTheme,
  DashboardThemeId,
  DashboardThemeVariant,
  DashboardThemeProp,
  DashboardThemeToken,
  RoleThemeDefinition,
} from './theme/theme-tokens';

export {
  SUPER_ADMIN_SIDEBAR,
  ADMIN_SIDEBAR,
  SELLER_SIDEBAR,
  BUYER_SIDEBAR,
} from './sidebar/sidebar-config';
export type { SidebarNavItem } from './sidebar/sidebar-config';

export { PageHeader } from './ui/PageHeader';
export type { PageHeaderProps } from './ui/PageHeader';

export { Card, DashboardCard } from './ui/Card';
export type { CardProps, DashboardCardProps } from './ui/Card';

export { ProfileDropdown } from './ui/ProfileDropdown';
export type { ProfileDropdownProps, ProfileDropdownUser } from './ui/ProfileDropdown';

export { NotificationBell } from './ui/NotificationBell';
export type { NotificationBellProps } from './ui/NotificationBell';

export { Tooltip } from './ui/Tooltip';
export type { TooltipProps } from './ui/Tooltip';

export { Button } from './ui/Button';
export { Input } from './ui/Input';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs';

export { Icon, DASHBOARD_ICONS } from './ui/Icon';
export type { IconProps, DashboardIconName } from './ui/Icon';

export { DashboardPagePlaceholder } from './components/dashboard-page-placeholder';
export type { DashboardPagePlaceholderProps } from './components/dashboard-page-placeholder';

export {
  getDashboardRouteByRole,
  getSidebarItemsByRole,
} from './lib/routes';

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
