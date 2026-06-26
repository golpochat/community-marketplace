export const NOTIFICATIONS_UPDATED_EVENT = 'cm:notifications-updated';

export interface NotificationsUpdatedDetail {
  unreadCount?: number;
}

/** Notify all notification bell / dashboard listeners to refresh unread counts. */
export function notifyNotificationsUpdated(unreadCount?: number) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<NotificationsUpdatedDetail>(NOTIFICATIONS_UPDATED_EVENT, {
      detail: unreadCount !== undefined ? { unreadCount } : {},
    }),
  );
}
