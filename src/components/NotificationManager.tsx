
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, Settings, Trash2, Clock, X, Volume2, VolumeX } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'sonner';
import dayjs from 'dayjs';

interface NotificationManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ isOpen, onClose }) => {
  const {
    notifications,
    settings,
    pendingCount,
    snoozeNotification,
    dismissNotification,
    deleteNotification,
    updateSettings,
    requestPermission
  } = useNotifications();

  const [showSettings, setShowSettings] = useState(false);

  const handleSnooze = (id: string, minutes: number) => {
    snoozeNotification(id, minutes);
    toast.success(`Notification snoozed for ${minutes} minutes`);
  };

  const handleDismiss = (id: string) => {
    dismissNotification(id);
    toast.success('Notification dismissed');
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    toast.success('Notification deleted');
  };

  const handleSettingChange = (setting: keyof typeof settings, value: boolean) => {
    updateSettings({ [setting]: value });
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Notification permission granted!');
    } else {
      toast.error('Notification permission denied');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reminder': return '📋';
      case 'timer': return '⏰';
      case 'ai': return '🧠';
      case 'spotify': return '🎵';
      default: return '🔔';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-500';
      case 'delivered': return 'bg-green-500';
      case 'snoozed': return 'bg-yellow-500';
      case 'dismissed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTime = (date: Date) => {
    return dayjs(date).format('MMM D, h:mm A');
  };

  if (showSettings) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Notification Settings</DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(false)}
                className="text-gray-400"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-200">Notification Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>📋</span>
                    <span className="text-sm text-gray-200">Todo Reminders</span>
                  </div>
                  <Switch
                    checked={settings.reminders}
                    onCheckedChange={(value) => handleSettingChange('reminders', value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>⏰</span>
                    <span className="text-sm text-gray-200">Timer Alerts</span>
                  </div>
                  <Switch
                    checked={settings.timers}
                    onCheckedChange={(value) => handleSettingChange('timers', value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>🧠</span>
                    <span className="text-sm text-gray-200">AI Nudges</span>
                  </div>
                  <Switch
                    checked={settings.ai}
                    onCheckedChange={(value) => handleSettingChange('ai', value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>🎵</span>
                    <span className="text-sm text-gray-200">Spotify Alerts</span>
                  </div>
                  <Switch
                    checked={settings.spotify}
                    onCheckedChange={(value) => handleSettingChange('spotify', value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-gray-200">Delivery Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <span className="text-sm text-gray-200">System Notifications</span>
                  </div>
                  <Switch
                    checked={settings.systemNotifications}
                    onCheckedChange={(value) => handleSettingChange('systemNotifications', value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>💬</span>
                    <span className="text-sm text-gray-200">In-App Toasts</span>
                  </div>
                  <Switch
                    checked={settings.inAppToasts}
                    onCheckedChange={(value) => handleSettingChange('inAppToasts', value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {settings.sounds ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    <span className="text-sm text-gray-200">Sound Effects</span>
                  </div>
                  <Switch
                    checked={settings.sounds}
                    onCheckedChange={(value) => handleSettingChange('sounds', value)}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                onClick={handleRequestPermission}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Request Browser Permission
              </Button>
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DialogTitle>Notifications</DialogTitle>
              {pendingCount > 0 && (
                <Badge variant="secondary" className="bg-blue-600">
                  {pendingCount} pending
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="text-gray-400"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
              <p className="text-sm">Your reminders and alerts will appear here</p>
            </div>
          ) : (
            notifications
              .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
              .map((notification) => (
                <Card key={notification.id} className="bg-gray-900 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-lg">{getTypeIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-200 text-sm">
                            {notification.title}
                          </h4>
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getStatusColor(notification.status)}`}
                          >
                            {notification.status}
                          </Badge>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatTime(notification.time)}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {notification.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleSnooze(notification.id, 10)}
                              className="p-1 h-auto text-yellow-400 hover:text-yellow-300"
                              title="Snooze 10 minutes"
                            >
                              <Clock className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDismiss(notification.id)}
                              className="p-1 h-auto text-gray-400 hover:text-gray-300"
                              title="Dismiss"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(notification.id)}
                          className="p-1 h-auto text-red-400 hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </div>

        <Button variant="secondary" onClick={onClose} className="mt-4">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationManager;
