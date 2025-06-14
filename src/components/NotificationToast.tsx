
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Zap, Settings, Clock } from 'lucide-react';
import { SmartNotification } from '@/services/NotificationEngine';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationToastProps {
  notification: SmartNotification | null;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { snoozeNotification } = useNotifications();

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Allow animation to complete
      }, 6000); // Show for 6 seconds

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return <Bell className="w-5 h-5 text-blue-400" />;
      case 'timer':
        return <Zap className="w-5 h-5 text-green-400" />;
      case 'ai':
        return <span className="text-lg">🧠</span>;
      case 'spotify':
        return <span className="text-lg">🎵</span>;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/50 bg-red-900/20';
      case 'medium': return 'border-yellow-500/50 bg-yellow-900/20';
      default: return 'border-blue-500/50 bg-blue-900/20';
    }
  };

  const handleSnooze = (minutes: number) => {
    if (notification) {
      snoozeNotification(notification.id, minutes);
      setIsVisible(false);
      setTimeout(onClose, 300);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!notification) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <div 
            className={`
              rounded-lg shadow-2xl p-4 backdrop-blur-sm border
              ${getPriorityColor(notification.priority)}
            `}
            style={{ 
              backgroundColor: 'var(--theme-surface)', 
              borderColor: 'var(--theme-border)'
            }}
          >
            <div className="flex items-start gap-3">
              {getIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-sm mb-1">
                  {notification.title}
                </h4>
                <p className="text-gray-300 text-sm mb-3">
                  {notification.message}
                </p>
                
                {/* Action buttons for dismissible notifications */}
                {notification.type === 'reminder' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSnooze(5)}
                      className="text-xs bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      5m
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSnooze(15)}
                      className="text-xs bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      15m
                    </Button>
                  </div>
                )}
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationToast;
