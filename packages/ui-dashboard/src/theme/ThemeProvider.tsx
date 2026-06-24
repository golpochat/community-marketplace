'use client';

import type { RbacRole } from '@community-marketplace/types';

import { resolveThemeToken, type DashboardThemeProp } from './theme-tokens';

export interface DashboardThemeProviderProps {
  role: RbacRole;
  theme?: DashboardThemeProp;
  children: React.ReactNode;
}

export function ThemeProvider({ role, theme, children }: DashboardThemeProviderProps) {
  const themeAttribute = resolveThemeToken(theme, role);

  return (
    <div
      data-dashboard-role={role}
      {...(themeAttribute ? { 'data-dashboard-theme': themeAttribute } : {})}
      className="dashboard-theme-root min-h-screen"
    >
      {children}
    </div>
  );
}

/** @deprecated Use ThemeProvider */
export const DashboardThemeProvider = ThemeProvider;
