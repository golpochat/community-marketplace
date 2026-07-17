'use client';

import { useEffect, useRef } from 'react';

import type { RbacRole } from '@community-marketplace/types';

import { resolveThemeToken, type DashboardThemeProp } from './theme-tokens';

export interface DashboardThemeProviderProps {
  role: RbacRole;
  theme?: DashboardThemeProp;
  children: React.ReactNode;
}

/** Mirrors themes.css --dashboard-accent so root-level toasts can brand correctly. */
const ROLE_FEEDBACK_ACCENT: Partial<Record<RbacRole, string>> = {
  SUPER_ADMIN: '271 81% 56%',
  ADMIN: '215 16% 47%',
  SELLER: '160 84% 36%',
  BUYER: '217 91% 60%',
  MEMBER: '217 91% 60%',
};

export function ThemeProvider({ role, theme, children }: DashboardThemeProviderProps) {
  const themeAttribute = resolveThemeToken(theme, role);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const accent =
      ROLE_FEEDBACK_ACCENT[role] ??
      getComputedStyle(rootRef.current ?? document.documentElement)
        .getPropertyValue('--dashboard-accent')
        .trim();
    if (!accent) return;

    const root = document.documentElement;
    root.style.setProperty('--feedback-accent', accent);
    root.style.setProperty('--feedback-accent-foreground', '0 0% 100%');
    root.dataset.feedbackRole = role;

    return () => {
      if (root.dataset.feedbackRole === role) {
        root.style.removeProperty('--feedback-accent');
        root.style.removeProperty('--feedback-accent-foreground');
        delete root.dataset.feedbackRole;
      }
    };
  }, [role]);

  return (
    <div
      ref={rootRef}
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
