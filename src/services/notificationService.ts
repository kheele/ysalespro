import { NotificationItem } from '@/lib/types';
import { getNotifications as getMockNotifications } from './notificationServices';

export async function getNotifications(userId?: string, orgId?: string): Promise<{ is_read: boolean }[]> {
  const notifs = await getMockNotifications();
  return notifs.map(n => ({ is_read: n.read }));
}
