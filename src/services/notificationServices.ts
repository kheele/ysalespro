import { NotificationType, NotificationPriority, NotificationItem } from '@/lib/types';
import { MOCK_NOTIFICATIONS } from '@/mock-data/notifications';

export type { NotificationType, NotificationPriority, NotificationItem };

export async function getNotifications(filterRead?: 'all' | 'unread'): Promise<NotificationItem[]> {
  if (filterRead === 'unread') {
    return MOCK_NOTIFICATIONS.filter(n => !n.read);
  }
  return [...MOCK_NOTIFICATIONS];
}

export async function markAsRead(id: number): Promise<NotificationItem> {
  const item = MOCK_NOTIFICATIONS.find(n => n.id === id);
  if (!item) throw new Error("Notification not found");
  item.read = true;
  return item;
}

export async function markAllAsRead(): Promise<void> {
  MOCK_NOTIFICATIONS.forEach(n => { n.read = true; });
}

export async function getUnreadCount(): Promise<number> {
  return MOCK_NOTIFICATIONS.filter(n => !n.read).length;
}

export const notificationServices = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
