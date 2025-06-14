
import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

interface NotificationSettings {
  enabled: boolean;
  maxNotifications: number;
  autoMarkRead: boolean;
  showToasts: boolean;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('notifications', []);
  const [settings, setSettings] = useLocalStorage<NotificationSettings>('notification-settings', {
    enabled: true,
    maxNotifications: 50,
    autoMarkRead: true,
    showToasts: true
  });

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    if (!settings.enabled) return;

    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false
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
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, [setNotifications]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, [setNotifications]);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, [setNotifications]);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, [setNotifications]);

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
    updateSettings: setSettings
  };
};
