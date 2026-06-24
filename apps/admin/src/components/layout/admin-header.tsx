'use client';

import { Button } from '@community-marketplace/ui';

import { useTheme } from '@/components/providers/theme-provider';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { adminAuthService } from '@/services/auth.service';

export function AdminHeader() {
  const { user, session, clearUser } = useAdminAuth();
  const { theme, toggle } = useTheme();

  async function handleSignOut() {
    try {
      if (session) {
        await adminAuthService.logout({
          refreshToken: session.refreshToken,
          sessionId: session.sessionId,
        });
      }
    } finally {
      clearUser();
      window.location.href = '/auth/login';
    }
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <p className="text-sm text-muted-foreground">Administration Panel</p>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={toggle} aria-label="Toggle theme">
          {theme === 'dark' ? 'Light' : 'Dark'}
        </Button>
        <span className="hidden text-sm text-foreground sm:inline">{user?.email}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{user?.role}</span>
        <Button variant="ghost" size="sm" onClick={() => void handleSignOut()}>
          Sign Out
        </Button>
      </div>
    </header>
  );
}
