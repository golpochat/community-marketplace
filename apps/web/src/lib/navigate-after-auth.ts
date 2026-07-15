/**
 * Hard-navigate after auth so the address bar updates immediately and dashboard
 * middleware sees cookies on a full request. Soft `router.push` leaves users on
 * /auth/login until the destination RSC finishes compiling.
 */
export function navigateAfterAuth(path: string | null | undefined): void {
  const normalized = typeof path === 'string' ? path.trim() : '';
  const target = normalized
    ? normalized.startsWith('/')
      ? normalized
      : `/${normalized}`
    : '/account';
  window.location.assign(target);
}
