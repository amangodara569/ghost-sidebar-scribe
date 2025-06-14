
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, Zap, Settings, X, Timer as TimerIcon } from 'lucide-react';
import { notificationService, Notification } from '@/services/NotificationService';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface NotificationCenterProps {
  widgetId: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ widgetId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'reminder' | 'focus' | 'system'>('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadNotifications();
    
    // Listen for new notifications
    const handleNewNotification = () => {
      loadNotifications();
    };

    window.addEventListener('notification:delivered', handleNewNotification);
    return () => window.removeEventListener('notification:delivered', handleNewNotification);
  }, []);

  const loadNotifications = () => {
    const allNotifications = notificationService.getNotifications();
    setNotifications(allNotifications);
    setUnreadCount(notificationService.getUnreadCount());
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    return notification.type === filter;
  }).sort((a, b) => dayjs(b.timestamp).unix() - dayjs(a.timestamp).unix());

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
    loadNotifications();
  };

  const handleDismiss = (id: string) => {
    notificationService.dismissNotification(id);
    loadNotifications();
  };

  const handleSnooze = (id: string, minutes: number) => {
    notificationService.snoozeNotification(id, minutes);
    loadNotifications();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return <Bell className="w-4 h-4" />;
      case 'focus':
        return <Zap className="w-4 h-4" />;
      case 'system':
        return <Settings className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reminder':
        return 'text-blue-400';
      case 'focus':
        return 'text-green-400';
      case 'system':
        return 'text-purple-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <Card className="bg-transparent border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg text-gray-100">Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex gap-1 mt-3">
          {[
            { key: 'all', label: 'All' },
            { key: 'reminder', label: 'Reminders' },
            { key: 'focus', label: 'Focus' },
            { key: 'system', label: 'System' }
          ].map((tab) => (
            <Button
              key={tab.key}
              size="sm"
              variant={filter === tab.key ? "default" : "outline"}
              onClick={() => setFilter(tab.key as any)}
              className={`text-xs ${
                filter === tab.key 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No notifications yet</p>
              <p className="text-sm">Your alerts will appear here</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`
                  p-3 rounded-lg border transition-all duration-200
                  ${notification.read 
                    ? 'bg-gray-800/50 border-gray-600' 
                    : 'bg-gray-800 border-blue-500/50 shadow-lg'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <div className={`mt-0.5 ${getTypeColor(notification.type)}`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-200 text-sm truncate">
                          {notification.title}
                        </h4>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {dayjs(notification.timestamp).fromNow()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">
                        {notification.message}
                      </p>
                      
                      {!notification.read && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="h-6 px-2 text-xs text-blue-400 hover:bg-blue-900/30"
                          >
                            Mark Read
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSnooze(notification.id, 5)}
                            className="h-6 px-2 text-xs text-yellow-400 hover:bg-yellow-900/30"
                          >
                            <TimerIcon className="w-3 h-3 mr-1" />
                            5m
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSnooze(notification.id, 30)}
                            className="h-6 px-2 text-xs text-yellow-400 hover:bg-yellow-900/30"
                          >
                            30m
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismiss(notification.id)}
                    className="h-6 w-6 p-0 text-gray-500 hover:text-red-400 hover:bg-red-900/30"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
