import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Palette, Plug, Bell } from 'lucide-react';
import { toast } from 'sonner';
import NotesWidget from './widgets/NotesWidget';
import ToDoWidget from './widgets/ToDoWidget';
import TimerWidget from './widgets/TimerWidget';
import BookmarkWidget from './widgets/BookmarkWidget';
import SpotifyWidget from './widgets/SpotifyWidget';
import LiveAnalyticsWidget from './widgets/LiveAnalyticsWidget';
import FreeSpaceWidget from './widgets/FreeSpaceWidget';
import NotificationCenter from './widgets/NotificationCenter';
import ThemeManager from './ThemeManager';
import NotificationToast from './NotificationToast';
import WorkspaceManager from './WorkspaceManager';
import PluginStore from './PluginStore';
import { useTheme } from '@/contexts/ThemeContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Notification } from '@/services/NotificationService';
import CommandPalette from './CommandPalette';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import VoiceController from './VoiceController';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import { createCommandRegistry } from '@/commands/commandRegistry';
import VibeMind from './VibeMind';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { usePluginSystem } from '@/hooks/usePluginSystem';
import NotificationManager from './NotificationManager';
import { useNotifications } from '@/hooks/useNotifications';

interface Widget {
  id: string;
  type: 'notes' | 'todo' | 'timer' | 'bookmark' | 'spotify' | 'analytics' | 'freespace' | 'notifications';
  order: number;
  enabled: boolean;
}

const WidgetContainer: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isThemeManagerOpen, setIsThemeManagerOpen] = useState(false);
  const [isNotificationManagerOpen, setIsNotificationManagerOpen] = useState(false);
  const [currentToast, setCurrentToast] = useState<any>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const { currentTheme, isCustom } = useTheme();
  const { 
    currentWorkspace, 
    updateWorkspace, 
    workspaces, 
    switchWorkspace, 
    createWorkspace 
  } = useWorkspace();
  const commandPalette = useCommandPalette();
  const { trackNoteActivity, trackTodoActivity, trackTimerActivity, trackSpotifyActivity } = useActivityTracker();
  const [currentFocusWidget, setCurrentFocusWidget] = useState<string>('');
  const { pendingCount } = useNotifications();
  
  // Plugin system integration
  const {
    plugins,
    isPluginStoreOpen,
    openPluginStore,
    closePluginStore,
    emitActivity
  } = usePluginSystem();

  useEffect(() => {
    // Load widget configuration from workspace or storage
    loadWidgets();
  }, [currentWorkspace]);

  // Add keyboard shortcut for theme toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        setIsThemeManagerOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for notification deliveries
  useEffect(() => {
    const handleNotificationDelivered = (event: CustomEvent<Notification>) => {
      setCurrentToast(event.detail);
    };

    window.addEventListener('notification:delivered', handleNotificationDelivered as EventListener);
    return () => window.removeEventListener('notification:delivered', handleNotificationDelivered as EventListener);
  }, []);

  // Listen for workspace switches
  useEffect(() => {
    const handleWorkspaceSwitch = (event: CustomEvent<any>) => {
      loadWidgetsFromWorkspace(event.detail);
    };

    window.addEventListener('workspace:switched', handleWorkspaceSwitch as EventListener);
    return () => window.removeEventListener('workspace:switched', handleWorkspaceSwitch as EventListener);
  }, []);

  // Listen for VibeMind widget focus events
  useEffect(() => {
    const handleFocusWidget = (event: CustomEvent<string>) => {
      setCurrentFocusWidget(event.detail);
      // Scroll to widget or highlight it
      const widgetElement = document.querySelector(`[data-widget="${event.detail}"]`);
      if (widgetElement) {
        widgetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    const handleStartTimer = (event: CustomEvent<number>) => {
      // Integrate with timer widget
      toast.success(`Starting ${event.detail} minute timer`);
    };

    window.addEventListener('vibemind:focus-widget', handleFocusWidget as EventListener);
    window.addEventListener('vibemind:start-timer', handleStartTimer as EventListener);

    return () => {
      window.removeEventListener('vibemind:focus-widget', handleFocusWidget as EventListener);
      window.removeEventListener('vibemind:start-timer', handleStartTimer as EventListener);
    };
  }, []);

  const loadWidgets = async () => {
    if (currentWorkspace) {
      loadWidgetsFromWorkspace(currentWorkspace);
    } else {
      // Fallback to default widgets
      setWidgets(getDefaultWidgets());
    }
  };

  const loadWidgetsFromWorkspace = (workspace: any) => {
    const workspaceWidgets = workspace.activeWidgets || [];
    const widgetConfig = workspaceWidgets.map((widgetId: string, index: number) => {
      const [type, id] = widgetId.split('-');
      return {
        id: widgetId,
        type: type as Widget['type'],
        order: index,
        enabled: true,
      };
    });
    setWidgets(widgetConfig);
  };

  const getDefaultWidgets = (): Widget[] => [
    { id: 'notifications-1', type: 'notifications', order: 0, enabled: true },
    { id: 'analytics-1', type: 'analytics', order: 1, enabled: true },
    { id: 'freespace-1', type: 'freespace', order: 2, enabled: true },
    { id: 'notes-1', type: 'notes', order: 3, enabled: true },
    { id: 'todo-1', type: 'todo', order: 4, enabled: true },
    { id: 'timer-1', type: 'timer', order: 5, enabled: true },
    { id: 'bookmark-1', type: 'bookmark', order: 6, enabled: true },
    { id: 'spotify-1', type: 'spotify', order: 7, enabled: true },
  ];

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedWidgets = items.map((widget, index) => ({
      ...widget,
      order: index,
    }));

    setWidgets(updatedWidgets);

    // Emit activity for plugins
    emitActivity({
      type: 'widget-reorder',
      timestamp: new Date().toISOString(),
      data: { widgets: updatedWidgets }
    });

    if (currentWorkspace && updateWorkspace) {
      const activeWidgets = updatedWidgets.map(w => w.id);
      await updateWorkspace(currentWorkspace.id, { activeWidgets });
    }
  };

  const renderWidget = (widget: Widget) => {
    const commonProps = {
      'data-widget': widget.type,
      onFocus: () => setCurrentFocusWidget(widget.type)
    };

    switch (widget.type) {
      case 'notifications':
        return <NotificationCenter key={widget.id} widgetId={widget.id} {...commonProps} />;
      case 'analytics':
        return <LiveAnalyticsWidget key={widget.id} widgetId={widget.id} {...commonProps} />;
      case 'freespace':
        return <FreeSpaceWidget key={widget.id} widgetId={widget.id} {...commonProps} />;
      case 'notes':
        return <NotesWidget key={widget.id} widgetId={widget.id} {...commonProps} />;
      case 'todo':
        return <ToDoWidget key={widget.id} widgetId={widget.id} {...commonProps} />;
      case 'timer':
        return <TimerWidget key={widget.id} widgetId={widget.id} {...commonProps} />;
      case 'bookmark':
        return <BookmarkWidget key={widget.id} widgetId={widget.id} {...commonProps} />;
      case 'spotify':
        return <SpotifyWidget key={widget.id} widgetId={widget.id} {...commonProps} />;
      default:
        return null;
    }
  };

  const commands = useMemo(() => {
    return createCommandRegistry({
      switchWorkspace: switchWorkspace || (() => {}),
      createWorkspace: createWorkspace || (() => {}),
      workspaces: workspaces || [],
      setIsThemeManagerOpen,
    });
  }, [workspaces, switchWorkspace, createWorkspace, setIsThemeManagerOpen]);

  const { findCommandByVoice } = useVoiceCommands(commands);

  const handleVoiceCommand = (transcript: string) => {
    console.log('Processing voice command:', transcript);
    
    const command = findCommandByVoice(transcript);
    if (command) {
      try {
        command.action();
        toast.success(`Voice command executed: ${command.label}`);
        
        // Emit activity for plugins
        emitActivity({
          type: 'voice-command',
          timestamp: new Date().toISOString(),
          data: { command: command.label, transcript }
        });
      } catch (error) {
        console.error('Voice command execution failed:', error);
        toast.error('Failed to execute voice command');
      }
    } else {
      toast.error(`Voice command not recognized: "${transcript}"`);
    }
  };

  return (
    <div 
      className="p-4 space-y-4 min-h-screen transition-colors duration-300"
      style={{ 
        backgroundColor: 'var(--theme-background)',
        color: 'var(--theme-text)'
      }}
    >
      {/* Workspace Manager */}
      <div className="mb-4">
        <WorkspaceManager />
      </div>

      {/* VibeMind AI Assistant */}
      <VibeMind currentWidget={currentFocusWidget} />

      {/* Theme Toggle Button */}
      <div className="flex justify-end mb-4 gap-2">
        <button
          onClick={() => setIsNotificationManagerOpen(true)}
          className="p-2 rounded-lg transition-all duration-200 hover:scale-105 relative"
          style={{ 
            backgroundColor: 'var(--theme-surface)',
            color: 'var(--theme-accent)',
            border: `1px solid var(--theme-border)`
          }}
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {pendingCount > 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
              {pendingCount > 9 ? '9+' : pendingCount}
            </div>
          )}
        </button>
        <button
          onClick={openPluginStore}
          className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
          style={{ 
            backgroundColor: 'var(--theme-surface)',
            color: 'var(--theme-accent)',
            border: `1px solid var(--theme-border)`
          }}
          title="Plugin Store"
        >
          <Plug className="w-5 h-5" />
        </button>
        <button
          onClick={() => setIsThemeManagerOpen(true)}
          className="p-2 rounded-lg transition-all duration-200 hover:scale-105"
          style={{ 
            backgroundColor: 'var(--theme-surface)',
            color: 'var(--theme-accent)',
            border: `1px solid var(--theme-border)`
          }}
          title="Theme Manager (Ctrl+Shift+T)"
        >
          <Palette className="w-5 h-5" />
        </button>
      </div>

      {/* Voice Controller */}
      <div className="fixed bottom-4 right-4 z-50">
        <div 
          className="rounded-lg border shadow-lg backdrop-blur-sm"
          style={{
            backgroundColor: `var(--theme-surface)`,
            borderColor: `var(--theme-border)`,
          }}
        >
          <VoiceController
            isEnabled={isVoiceEnabled}
            onToggleEnabled={setIsVoiceEnabled}
            onVoiceCommand={handleVoiceCommand}
          />
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="widgets">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {widgets
                .filter(widget => widget.enabled)
                .sort((a, b) => a.order - b.order)
                .map((widget, index) => (
                  <Draggable key={widget.id} draggableId={widget.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`
                          rounded-lg border transition-all duration-200 backdrop-blur-sm
                          ${snapshot.isDragging ? 'shadow-2xl scale-105' : 'shadow-lg'}
                        `}
                        style={{
                          backgroundColor: `var(--theme-surface)`,
                          borderColor: `var(--theme-border)`,
                          opacity: `var(--theme-opacity)`,
                        }}
                      >
                        {renderWidget(widget)}
                      </div>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <ThemeManager 
        isOpen={isThemeManagerOpen} 
        onClose={() => setIsThemeManagerOpen(false)} 
      />

      <PluginStore
        isOpen={isPluginStoreOpen}
        onClose={closePluginStore}
      />

      <NotificationManager
        isOpen={isNotificationManagerOpen}
        onClose={() => setIsNotificationManagerOpen(false)}
      />

      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
        setIsThemeManagerOpen={setIsThemeManagerOpen}
      />

      <NotificationToast
        notification={currentToast}
        onClose={() => setCurrentToast(null)}
      />
    </div>
  );
};

export default WidgetContainer;
