
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

export interface SmartNotification {
  id: string;
  type: 'reminder' | 'timer' | 'ai' | 'spotify';
  title: string;
  message: string;
  time: Date;
  status: 'pending' | 'delivered' | 'snoozed' | 'dismissed';
  repeat?: boolean;
  repeatInterval?: number; // in minutes
  sound?: boolean;
  priority: 'low' | 'medium' | 'high';
  data?: any; // Additional context data
  userId?: string;
}

export interface NotificationSettings {
  reminders: boolean;
  timers: boolean;
  ai: boolean;
  spotify: boolean;
  sounds: boolean;
  systemNotifications: boolean;
  inAppToasts: boolean;
}

export class NotificationEngine {
  private notifications: SmartNotification[] = [];
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private settings: NotificationSettings = {
    reminders: true,
    timers: true,
    ai: true,
    spotify: false,
    sounds: true,
    systemNotifications: true,
    inAppToasts: true,
  };

  constructor() {
    this.loadNotifications();
    this.loadSettings();
    this.startPeriodicCheck();
  }

  async loadNotifications(): Promise<void> {
    try {
      if (window.electronAPI) {
        const stored = await window.electronAPI.invoke('notifications:getAll');
        this.notifications = stored || [];
        this.rescheduleAllNotifications();
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

  async loadSettings(): Promise<void> {
    try {
      if (window.electronAPI) {
        const stored = await window.electronAPI.invoke('notifications:getSettings');
        this.settings = { ...this.settings, ...stored };
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  async saveSettings(): Promise<void> {
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('notifications:saveSettings', this.settings);
      }
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  }

  // Schedule different types of notifications
  scheduleReminder(todoId: string, title: string, dueDate: Date, reminderMinutes: number = 5): string {
    if (!this.settings.reminders) return '';

    const reminderTime = new Date(dueDate.getTime() - (reminderMinutes * 60 * 1000));
    
    const notification: SmartNotification = {
      id: uuidv4(),
      type: 'reminder',
      title: 'Todo Reminder',
      message: `Don't forget: ${title}`,
      time: reminderTime,
      status: 'pending',
      sound: this.settings.sounds,
      priority: 'medium',
      data: { todoId, originalDueDate: dueDate, reminderMinutes }
    };

    return this.addNotification(notification);
  }

  scheduleTimerAlert(type: 'work-end' | 'break-end', duration: number): string {
    if (!this.settings.timers) return '';

    const alertTime = new Date(Date.now() + (duration * 60 * 1000));
    const isWorkEnd = type === 'work-end';
    
    const notification: SmartNotification = {
      id: uuidv4(),
      type: 'timer',
      title: isWorkEnd ? 'Break Time!' : 'Back to Work!',
      message: isWorkEnd 
        ? 'Great work! Time for a well-deserved break.' 
        : 'Break\'s over. Ready to get back to it?',
      time: alertTime,
      status: 'pending',
      sound: this.settings.sounds,
      priority: 'high',
      data: { timerType: type, duration }
    };

    return this.addNotification(notification);
  }

  scheduleAINudge(message: string, priority: 'low' | 'medium' | 'high' = 'low', delayMinutes: number = 0): string {
    if (!this.settings.ai) return '';

    const nudgeTime = new Date(Date.now() + (delayMinutes * 60 * 1000));
    
    const notification: SmartNotification = {
      id: uuidv4(),
      type: 'ai',
      title: 'VibeMind Insight',
      message,
      time: nudgeTime,
      status: 'pending',
      sound: priority === 'high' && this.settings.sounds,
      priority,
      data: { source: 'vibemind' }
    };

    return this.addNotification(notification);
  }

  scheduleSpotifyAlert(message: string, delayMinutes: number = 30): string {
    if (!this.settings.spotify) return '';

    const alertTime = new Date(Date.now() + (delayMinutes * 60 * 1000));
    
    const notification: SmartNotification = {
      id: uuidv4(),
      type: 'spotify',
      title: 'Music Suggestion',
      message,
      time: alertTime,
      status: 'pending',
      sound: false,
      priority: 'low',
      data: { suggestion: true }
    };

    return this.addNotification(notification);
  }

  private addNotification(notification: SmartNotification): string {
    this.notifications.push(notification);
    this.saveNotifications();
    this.scheduleDelivery(notification);
    return notification.id;
  }

  private scheduleDelivery(notification: SmartNotification): void {
    const delay = notification.time.getTime() - Date.now();
    
    if (delay <= 0) {
      // Deliver immediately if time has passed
      this.deliverNotification(notification);
      return;
    }

    const timer = setTimeout(() => {
      this.deliverNotification(notification);
    }, delay);

    this.timers.set(notification.id, timer);
  }

  private async deliverNotification(notification: SmartNotification): Promise<void> {
    // Check if notification is still valid
    const current = this.notifications.find(n => n.id === notification.id);
    if (!current || current.status !== 'pending') return;

    // Mark as delivered
    current.status = 'delivered';
    this.saveNotifications();

    // System notification
    if (this.settings.systemNotifications) {
      try {
        if (window.electronAPI) {
          await window.electronAPI.invoke('notifications:show', {
            title: notification.title,
            message: notification.message,
            sound: notification.sound,
            type: notification.type
          });
        } else if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id
          });
        }
      } catch (error) {
        console.error('Failed to show system notification:', error);
      }
    }

    // In-app toast
    if (this.settings.inAppToasts) {
      window.dispatchEvent(new CustomEvent('notification:delivered', {
        detail: notification
      }));
    }

    // Play sound
    if (notification.sound && this.settings.sounds) {
      this.playNotificationSound(notification.type);
    }

    // Clean up timer
    this.timers.delete(notification.id);

    // Schedule repeat if needed
    if (notification.repeat && notification.repeatInterval) {
      const nextTime = new Date(notification.time.getTime() + (notification.repeatInterval * 60 * 1000));
      const repeatNotification = {
        ...notification,
        id: uuidv4(),
        time: nextTime,
        status: 'pending' as const
      };
      this.addNotification(repeatNotification);
    }
  }

  private playNotificationSound(type: string): void {
    try {
      const audio = new Audio();
      
      // Different sounds for different notification types
      switch (type) {
        case 'timer':
          audio.src = '/sounds/timer-alert.mp3';
          break;
        case 'reminder':
          audio.src = '/sounds/reminder-chime.mp3';
          break;
        case 'ai':
          audio.src = '/sounds/ai-notification.mp3';
          break;
        default:
          audio.src = '/sounds/default-notification.mp3';
      }
      
      audio.volume = 0.5;
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  private rescheduleAllNotifications(): void {
    // Clear existing timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();

    // Reschedule pending notifications
    this.notifications
      .filter(n => n.status === 'pending')
      .forEach(n => this.scheduleDelivery(n));
  }

  private startPeriodicCheck(): void {
    // Check every minute for any missed notifications
    setInterval(() => {
      const now = Date.now();
      this.notifications
        .filter(n => n.status === 'pending' && n.time.getTime() <= now)
        .forEach(n => this.deliverNotification(n));
    }, 60000);
  }

  // Public methods for managing notifications
  snoozeNotification(id: string, minutes: number): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.status = 'snoozed';
      notification.time = new Date(Date.now() + (minutes * 60 * 1000));
      this.saveNotifications();
      this.scheduleDelivery(notification);
    }
  }

  dismissNotification(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.status = 'dismissed';
      this.saveNotifications();
      
      const timer = this.timers.get(id);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(id);
      }
    }
  }

  deleteNotification(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index > -1) {
      const timer = this.timers.get(id);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(id);
      }
      
      this.notifications.splice(index, 1);
      this.saveNotifications();
    }
  }

  getNotifications(type?: SmartNotification['type']): SmartNotification[] {
    if (type) {
      return this.notifications.filter(n => n.type === type);
    }
    return this.notifications;
  }

  getPendingCount(): number {
    return this.notifications.filter(n => n.status === 'pending').length;
  }

  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
}

// Global instance
export const notificationEngine = new NotificationEngine();
