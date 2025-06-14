
// Legacy compatibility layer - redirects to new NotificationEngine
import { notificationEngine, SmartNotification } from './NotificationEngine';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'focus' | 'system';
  timestamp: string;
  repeatInterval?: number;
  sound?: boolean;
  delivered: boolean;
  read: boolean;
  snoozedUntil?: string;
  userId?: string;
}

// Convert old notification format to new format
const convertLegacyNotification = (legacy: Notification): SmartNotification => ({
  id: legacy.id,
  type: legacy.type === 'focus' ? 'timer' : legacy.type === 'system' ? 'ai' : 'reminder',
  title: legacy.title,
  message: legacy.message,
  time: new Date(legacy.timestamp),
  status: legacy.delivered ? 'delivered' : 'pending',
  repeat: !!legacy.repeatInterval,
  repeatInterval: legacy.repeatInterval,
  sound: legacy.sound,
  priority: 'medium',
  data: { legacy: true }
});

export class NotificationService {
  private notifications: Notification[] = [];

  constructor() {
    console.warn('NotificationService is deprecated. Please use NotificationEngine instead.');
  }

  async loadNotifications(): Promise<void> {
    // Migration logic - load old notifications and convert them
    try {
      if (window.electronAPI) {
        const stored = await window.electronAPI.invoke('notifications:getHistory');
        if (stored && stored.length > 0) {
          // Migrate old notifications to new system
          stored.forEach((legacy: Notification) => {
            const converted = convertLegacyNotification(legacy);
            // Use the new engine's internal methods if available
          });
        }
      }
    } catch (error) {
      console.error('Failed to migrate legacy notifications:', error);
    }
  }

  scheduleNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'delivered' | 'read'>): string {
    // Redirect to new notification engine
    if (notification.type === 'reminder') {
      return notificationEngine.scheduleAINudge(notification.message, 'medium');
    } else if (notification.type === 'focus') {
      return notificationEngine.scheduleTimerAlert('work-end', 25);
    } else {
      return notificationEngine.scheduleAINudge(notification.message, 'low');
    }
  }

  snoozeNotification(id: string, minutes: number): void {
    notificationEngine.snoozeNotification(id, minutes);
  }

  markAsRead(id: string): void {
    notificationEngine.dismissNotification(id);
  }

  dismissNotification(id: string): void {
    notificationEngine.deleteNotification(id);
  }

  getNotifications(filter?: 'reminder' | 'focus' | 'system'): Notification[] {
    // Convert new notifications back to legacy format for compatibility
    const typeMap = { reminder: 'reminder', timer: 'focus', ai: 'system', spotify: 'system' };
    return notificationEngine.getNotifications()
      .filter(n => !filter || typeMap[n.type as keyof typeof typeMap] === filter)
      .map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: typeMap[n.type as keyof typeof typeMap] as 'reminder' | 'focus' | 'system',
        timestamp: n.time.toISOString(),
        repeatInterval: n.repeatInterval,
        sound: n.sound,
        delivered: n.status === 'delivered',
        read: n.status === 'dismissed',
        snoozedUntil: n.status === 'snoozed' ? n.time.toISOString() : undefined
      }));
  }

  getUnreadCount(): number {
    return notificationEngine.getPendingCount();
  }
}

// Global instance (legacy compatibility)
export const notificationService = new NotificationService();
