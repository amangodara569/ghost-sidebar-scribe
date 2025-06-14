
import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder' | 'timer' | 'ai' | 'spotify';
  timestamp: number;
  time?: Date;
  read: boolean;
  status?: 'pending' | 'delivered' | 'snoozed' | 'dismissed';
  priority: 'low' | 'medium' | 'high';
}

interface NotificationSettings {
  enabled: boolean;
  maxNotifications: number;
  autoMarkRead: boolean;
  showToasts: boolean;
  reminders: boolean;
  timers: boolean;
  ai: boolean;
  spotify: boolean;
  systemNotifications: boolean;
  inAppToasts: boolean;
  sounds: boolean;
}

const defaultSettings: NotificationSettings = {
  enabled: true,
  maxNotifications: 50,
  autoMarkRead: true,
  showToasts: true,
  reminders: true,
  timers: true,
  ai: true,
  spotify: false,
  systemNotifications: true,
  inAppToasts: true,
  sounds: true
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('notifications', []);
  const [settings, setSettings] = useLocalStorage<NotificationSettings>('notification-settings', defaultSettings);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!settings.enabled) return;

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      time: new Date(),
      read: false,
      status: 'pending'
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, settings.maxNotifications);
    });

    // Dispatch event for toast display
    if (settings.showToasts) {
      window.dispatchEvent(new CustomEvent('notification:delivered', { 
        detail: newNotification 
      }));
    }
  }, [settings, setNotifications]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true, status: 'dismissed' } : notif
      )
    );
  }, [setNotifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true, status: 'dismissed' }))
    );
  }, [setNotifications]);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, [setNotifications]);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, [setNotifications]);

  const snoozeNotification = useCallback((id: string, minutes: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { 
          ...notif, 
          status: 'snoozed',
          time: new Date(Date.now() + (minutes * 60 * 1000))
        } : notif
      )
    );
  }, [setNotifications]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, status: 'dismissed', read: true } : notif
      )
    );
  }, [setNotifications]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);

  const pendingCount = notifications.filter(n => !n.read).length;
  const unreadHighPriority = notifications.filter(n => !n.read && n.priority === 'high').length;

  return {
    notifications,
    settings,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    pendingCount,
    unreadHighPriority,
    snoozeNotification,
    dismissNotification,
    requestPermission,
    updateSettings
  };
};
