'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

import { isMarketplaceRole } from '@community-marketplace/types';

import { WEB_APP_ROUTES } from '@/lib/constants';
import { refreshClientSession } from '@/lib/web-session';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

/** Level 3 marketplace members: logout after this much inactivity. */
const MEMBER_IDLE_MS = 15 * 60 * 1000;
/** Refresh access token this far before expiry while the user is still active. */
const PROACTIVE_REFRESH_BEFORE_MS = 2 * 60 * 1000;
const ACTIVITY_STORAGE_KEY = 'cm-auth-activity';
const ACTIVITY_THROTTLE_MS = 1000;
const CHECK_INTERVAL_MS = 15_000;

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousedown',
  'mousemove',
  'keydown',
  'touchstart',
  'scroll',
  'click',
  'wheel',
];

function readLastActivity(): number {
  if (typeof window === 'undefined') return Date.now();
  const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function writeLastActivity(timestamp: number): void {
  localStorage.setItem(ACTIVITY_STORAGE_KEY, String(timestamp));
}

/**
 * Keeps Level 3 (MEMBER / legacy BUYER|SELLER) sessions alive while the user
 * is active, and logs them out after 15 minutes of inactivity.
 */
export function AuthIdleTimeout() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const clearUser = useAuthStore((state) => state.clearUser);
  const loggingOutRef = useRef(false);
  const refreshingRef = useRef(false);
  const lastMarkRef = useRef(0);

  const isMarketplaceUser = Boolean(user && isMarketplaceRole(user.role));

  useEffect(() => {
    if (!isMarketplaceUser || !session) {
      loggingOutRef.current = false;
      return;
    }

    const markActivity = () => {
      const now = Date.now();
      if (now - lastMarkRef.current < ACTIVITY_THROTTLE_MS) return;
      lastMarkRef.current = now;
      writeLastActivity(now);
    };

    // Seed activity on mount / when session becomes available
    markActivity();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') markActivity();
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === ACTIVITY_STORAGE_KEY && event.newValue) {
        lastMarkRef.current = Date.now();
      }
    };

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, markActivity, { passive: true });
    }
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('storage', onStorage);

    const tick = () => {
      if (loggingOutRef.current) return;

      const lastActivity = readLastActivity();
      const idleFor = Date.now() - lastActivity;

      if (idleFor >= MEMBER_IDLE_MS) {
        loggingOutRef.current = true;
        void (async () => {
          try {
            const current = useAuthStore.getState().session;
            if (current?.refreshToken || current?.sessionId) {
              await authService.logout({
                refreshToken: current.refreshToken,
                sessionId: current.sessionId,
              });
            }
          } catch {
            // Clear local session even if the API logout fails
          } finally {
            clearUser();
            localStorage.removeItem(ACTIVITY_STORAGE_KEY);
            window.location.href = WEB_APP_ROUTES.login;
          }
        })();
        return;
      }

      const currentSession = useAuthStore.getState().session;
      if (!currentSession || refreshingRef.current) return;

      const expiresAt =
        new Date(currentSession.issuedAt).getTime() + currentSession.expiresIn * 1000;
      const msUntilExpiry = expiresAt - Date.now();

      if (msUntilExpiry <= PROACTIVE_REFRESH_BEFORE_MS && idleFor < MEMBER_IDLE_MS) {
        refreshingRef.current = true;
        void refreshClientSession()
          .then((token) => {
            if (token) markActivity();
          })
          .finally(() => {
            refreshingRef.current = false;
          });
      }
    };

    const intervalId = window.setInterval(tick, CHECK_INTERVAL_MS);
    tick();

    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, markActivity);
      }
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('storage', onStorage);
      window.clearInterval(intervalId);
    };
  }, [isMarketplaceUser, session, clearUser]);

  // Route changes count as activity for marketplace members
  useEffect(() => {
    if (!isMarketplaceUser || !session) return;
    writeLastActivity(Date.now());
  }, [pathname, isMarketplaceUser, session]);

  return null;
}
