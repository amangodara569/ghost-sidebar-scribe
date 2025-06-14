
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SidebarOverlay from './SidebarOverlay';
import WidgetContainer from './WidgetContainer';
import CommandPalette from './CommandPalette';
import VoiceController from './VoiceController';
import NotificationManager from './NotificationManager';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { useNotifications } from '@/hooks/useNotifications';
import { useVibeAnalytics } from '@/hooks/useVibeAnalytics';
import { trackActivity } from '@/services/analyticsEngine';

const VibeMind: React.FC = () => {
  const [isSidebarVisible, setIsSidebarVisible] = useLocalStorage('sidebar-visible', true);
  const [isThemeManagerOpen, setIsThemeManagerOpen] = useState(false);
  const [isNotificationManagerOpen, setIsNotificationManagerOpen] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const { isOpen: isCommandPaletteOpen, toggle: toggleCommandPalette } = useCommandPalette();
  
  // Initialize analytics
  useVibeAnalytics();
  
  // Initialize voice commands
  useVoiceCommands();
  
  // Initialize notifications with default config
  useNotifications({ enabled: true });

  useEffect(() => {
    trackActivity('system', 'vibemind-mounted');
  }, []);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
    trackActivity('system', 'sidebar-toggled', { visible: !isSidebarVisible });
  };

  const handleVoiceCommand = (command: string) => {
    console.log('Voice command received:', command);
    trackActivity('voice', 'command-executed', { command });
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-900 relative">
      {/* Main Content - Simple landing/dashboard */}
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-4xl font-bold mb-4">VibeMind</h1>
          <p className="text-xl text-gray-300 mb-8">Your productivity companion</p>
          <p className="text-sm text-gray-400">Press Ctrl+Shift+Space to open the sidebar</p>
        </div>
      </div>

      {/* Movable Sidebar Overlay */}
      <SidebarOverlay 
        isVisible={isSidebarVisible} 
        onToggleVisibility={toggleSidebar}
      >
        <WidgetContainer />
      </SidebarOverlay>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => toggleCommandPalette()} 
        setIsThemeManagerOpen={setIsThemeManagerOpen}
      />

      {/* Voice Controller */}
      <VoiceController 
        isEnabled={isVoiceEnabled}
        onToggleEnabled={setIsVoiceEnabled}
        onVoiceCommand={handleVoiceCommand}
      />

      {/* Notification Manager */}
      <NotificationManager 
        isOpen={isNotificationManagerOpen}
        onClose={() => setIsNotificationManagerOpen(false)}
      />
    </div>
  );
};

export default VibeMind;
