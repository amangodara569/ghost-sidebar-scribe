
import { useState, useEffect, useCallback } from 'react';
import { notificationEngine, SmartNotification, NotificationSettings } from '@/services/NotificationEngine';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(notificationEngine.getSettings());
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Load initial data
    setNotifications(notificationEngine.getNotifications());
    setPendingCount(notificationEngine.getPendingCount());

    // Listen for notification updates
    const handleNotificationUpdate = () => {
      setNotifications(notificationEngine.getNotifications());
      setPendingCount(notificationEngine.getPendingCount());
    };

    // Set up periodic refresh
    const interval = setInterval(handleNotificationUpdate, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const scheduleReminder = useCallback((todoId: string, title: string, dueDate: Date, reminderMinutes?: number) => {
    return notificationEngine.scheduleReminder(todoId, title, dueDate, reminderMinutes);
  }, []);

  const scheduleTimerAlert = useCallback((type: 'work-end' | 'break-end', duration: number) => {
    return notificationEngine.scheduleTimerAlert(type, duration);
  }, []);

  const scheduleAINudge = useCallback((message: string, priority?: 'low' | 'medium' | 'high', delayMinutes?: number) => {
    return notificationEngine.scheduleAINudge(message, priority, delayMinutes);
  }, []);

  const scheduleSpotifyAlert = useCallback((message: string, delayMinutes?: number) => {
    return notificationEngine.scheduleSpotifyAlert(message, delayMinutes);
  }, []);

  const snoozeNotification = useCallback((id: string, minutes: number) => {
    notificationEngine.snoozeNotification(id, minutes);
    setNotifications(notificationEngine.getNotifications());
    setPendingCount(notificationEngine.getPendingCount());
  }, []);

  const dismissNotification = useCallback((id: string) => {
    notificationEngine.dismissNotification(id);
    setNotifications(notificationEngine.getNotifications());
    setPendingCount(notificationEngine.getPendingCount());
  }, []);

  const deleteNotification = useCallback((id: string) => {
    notificationEngine.deleteNotification(id);
    setNotifications(notificationEngine.getNotifications());
    setPendingCount(notificationEngine.getPendingCount());
  }, []);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    notificationEngine.updateSettings(newSettings);
    setSettings(notificationEngine.getSettings());
  }, []);

  const requestPermission = useCallback(() => {
    return notificationEngine.requestPermission();
  }, []);

  return {
    notifications,
    settings,
    pendingCount,
    scheduleReminder,
    scheduleTimerAlert,
    scheduleAINudge,
    scheduleSpotifyAlert,
    snoozeNotification,
    dismissNotification,
    deleteNotification,
    updateSettings,
    requestPermission,
  };
};
