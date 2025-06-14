
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Zap, Settings } from 'lucide-react';
import { Notification } from '@/services/NotificationService';

interface NotificationToastProps {
  notification: Notification | null;
  onClose: () => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Allow animation to complete
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return <Bell className="w-5 h-5 text-blue-400" />;
      case 'focus':
        return <Zap className="w-5 h-5 text-green-400" />;
      case 'system':
        return <Settings className="w-5 h-5 text-purple-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
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
            className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl p-4 backdrop-blur-sm"
            style={{ backgroundColor: 'var(--theme-surface)', borderColor: 'var(--theme-border)' }}
          >
            <div className="flex items-start gap-3">
              {getIcon(notification.type)}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-white text-sm mb-1">
                  {notification.title}
                </h4>
                <p className="text-gray-300 text-sm">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsVisible(false);
                  setTimeout(onClose, 300);
                }}
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
