
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'focus' | 'system';
  timestamp: string;
  repeatInterval?: number; // in minutes
  sound?: boolean;
  delivered: boolean;
  read: boolean;
  snoozedUntil?: string;
  userId?: string;
}

export class NotificationService {
  private notifications: Notification[] = [];
  private timers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.loadNotifications();
  }

  async loadNotifications(): Promise<void> {
    try {
      if (window.electronAPI) {
        const stored = await window.electronAPI.invoke('notifications:getHistory');
        this.notifications = stored || [];
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  async saveNotifications(): Promise<void> {
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('notifications:save', this.notifications);
      }
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  scheduleNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'delivered' | 'read'>): string {
    const id = uuidv4();
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: dayjs().toISOString(),
      delivered: false,
      read: false,
    };

    this.notifications.push(newNotification);
    this.saveNotifications();

    // Schedule delivery
    if (notification.repeatInterval) {
      this.scheduleRepeating(newNotification);
    } else {
      this.scheduleOneTime(newNotification);
    }

    return id;
  }

  private scheduleOneTime(notification: Notification): void {
    const timer = setTimeout(() => {
      this.deliverNotification(notification);
    }, 1000); // Immediate for demo, can be modified for future scheduling

    this.timers.set(notification.id, timer);
  }

  private scheduleRepeating(notification: Notification): void {
    if (!notification.repeatInterval) return;

    const timer = setInterval(() => {
      this.deliverNotification(notification);
    }, notification.repeatInterval * 60 * 1000);

    this.timers.set(notification.id, timer);
  }

  private async deliverNotification(notification: Notification): Promise<void> {
    // Check if snoozed
    if (notification.snoozedUntil && dayjs().isBefore(dayjs(notification.snoozedUntil))) {
      return;
    }

    // Mark as delivered
    notification.delivered = true;
    this.saveNotifications();

    // Send to Electron for native notification
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('notifications:show', {
          title: notification.title,
          message: notification.message,
          sound: notification.sound,
        });
      }
    } catch (error) {
      console.error('Failed to show notification:', error);
    }

    // Emit to UI components
    window.dispatchEvent(new CustomEvent('notification:delivered', {
      detail: notification
    }));
  }

  snoozeNotification(id: string, minutes: number): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.snoozedUntil = dayjs().add(minutes, 'minute').toISOString();
      this.saveNotifications();
    }
  }

  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
    }
  }

  dismissNotification(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index > -1) {
      // Clear timer if exists
      const timer = this.timers.get(id);
      if (timer) {
        clearTimeout(timer);
        clearInterval(timer);
        this.timers.delete(id);
      }

      this.notifications.splice(index, 1);
      this.saveNotifications();
    }
  }

  getNotifications(filter?: 'reminder' | 'focus' | 'system'): Notification[] {
    if (filter) {
      return this.notifications.filter(n => n.type === filter);
    }
    return this.notifications;
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => n.delivered && !n.read).length;
  }
}

// Global instance
export const notificationService = new NotificationService();
