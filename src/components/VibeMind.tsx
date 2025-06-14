
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
  const { isOpen: isCommandPaletteOpen, toggleOpen: toggleCommandPalette } = useCommandPalette();
  
  // Initialize analytics
  useVibeAnalytics();
  
  // Initialize voice commands
  useVoiceCommands();
  
  // Initialize notifications
  useNotifications();

  useEffect(() => {
    trackActivity('system', 'vibemind-mounted');
  }, []);

  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible);
    trackActivity('ui', 'sidebar-toggled', { visible: !isSidebarVisible });
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-gray-900 relative">
      {/* Main Content */}
      <div className="h-full w-full">
        <WidgetContainer />
      </div>

      {/* Hovering Sidebar Overlay */}
      <SidebarOverlay 
        isVisible={isSidebarVisible} 
        onToggleVisibility={toggleSidebar}
      >
        <WidgetContainer />
      </SidebarOverlay>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => toggleCommandPalette(false)} 
      />

      {/* Voice Controller */}
      <VoiceController />

      {/* Notification Manager */}
      <NotificationManager />
    </div>
  );
};

export default VibeMind;
