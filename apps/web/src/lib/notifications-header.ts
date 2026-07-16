/** Page header subtitle for the notifications inbox. */
export function notificationsHeaderDescription(
  unreadCount: number,
  totalCount: number,
): string {
  if (totalCount === 0) return 'All caught up';
  if (unreadCount > 0) return `${unreadCount} unread`;
  return 'No unread notifications';
}
