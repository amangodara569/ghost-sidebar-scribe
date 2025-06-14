import React, { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Palette, Plug, Bell, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import SidebarOverlay from './SidebarOverlay';
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
import SettingsPanel from './SettingsPanel';
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
import InsightsDashboard from './widgets/InsightsDashboard';
import DailySummaryPopup from './DailySummaryPopup';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useBackgroundTasks } from '@/hooks/useBackgroundTasks';
import ScratchpadWidget from './widgets/ScratchpadWidget';
import StickyNotesWidget from './widgets/StickyNotesWidget';
import FocusTrackerWidget from './widgets/FocusTrackerWidget';
import { useFocusTracker } from '@/hooks/useFocusTracker';
import WriterPad from './WriterPad';

interface Widget {
  id: string;
  type: 'notes' | 'todo' | 'timer' | 'bookmark' | 'spotify' | 'analytics' | 'freespace' | 'notifications' | 'insights' | 'scratchpad' | 'stickynotes' | 'focustracker';
  order: number;
  enabled: boolean;
}

const WidgetContainer: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isThemeManagerOpen, setIsThemeManagerOpen] = useState(false);
  const [isNotificationManagerOpen, setIsNotificationManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWriterPadOpen, setIsWriterPadOpen] = useState(false);
  const [currentToast, setCurrentToast] = useState<any>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
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
  const { trackFocusActivity } = useFocusTracker();
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

  // Performance monitoring
  const { logCustomMetric } = usePerformanceMonitor('WidgetContainer');
  const { registerTask, unregisterTask } = useBackgroundTasks();

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
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        setIsSettingsOpen(prev => !prev);
      }
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'W') {
        event.preventDefault();
        setIsWriterPadOpen(prev => !prev);
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

  // Register background analytics polling
  useEffect(() => {
    registerTask({
      id: 'analytics-polling',
      interval: 30000, // 30 seconds
      callback: () => {
        // Trigger analytics update
        window.dispatchEvent(new CustomEvent('analytics:updated'));
        logCustomMetric('analytics-poll', Date.now());
      },
      enabled: true
    });

    return () => unregisterTask('analytics-polling');
  }, [registerTask, unregisterTask, logCustomMetric]);

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
    { id: 'focustracker-1', type: 'focustracker', order: 1, enabled: true },
    { id: 'insights-1', type: 'insights', order: 2, enabled: true },
    { id: 'stickynotes-1', type: 'stickynotes', order: 3, enabled: true },
    { id: 'scratchpad-1', type: 'scratchpad', order: 4, enabled: true },
    { id: 'analytics-1', type: 'analytics', order: 5, enabled: true },
    { id: 'freespace-1', type: 'freespace', order: 6, enabled: true },
    { id: 'notes-1', type: 'notes', order: 7, enabled: true },
    { id: 'todo-1', type: 'todo', order: 8, enabled: true },
    { id: 'timer-1', type: 'timer', order: 9, enabled: true },
    { id: 'bookmark-1', type: 'bookmark', order: 10, enabled: true },
    { id: 'spotify-1', type: 'spotify', order: 11, enabled: true },
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
      onFocus: () => setCurrentFocusWidget(widget.type),
      className: 'sidebar-widget'
    };

    switch (widget.type) {
      case 'notifications':
        return <NotificationCenter key={widget.id} widgetId={widget.id} {...commonProps} />;
      case 'focustracker':
        return <FocusTrackerWidget key={widget.id} widgetId={widget.id} {...commonProps} />;
      case 'insights':
        return <InsightsDashboard key={widget.id} widgetId={widget.id} {...commonProps} />;
      case 'stickynotes':
        return <StickyNotesWidget key={widget.id} widgetId={widget.id} {...commonProps} />;
      case 'scratchpad':
        return <ScratchpadWidget key={widget.id} widgetId={widget.id} {...commonProps} />;
      case 'analytics':
        return <LiveAnalyticsWidget key={widget.id} widgetId={widget.id} {...commonProps} />;
      case 'freespace':
        return <FreeSpaceWidget key={widget.id} widgetId={widget.id} {...commonProps} />;
      case 'notes':
        return <NotesWidget key={widget.id} widgetId={widget.id} {...commonProps} onActivity={() => trackFocusActivity('note')} />;
      case 'todo':
        return <ToDoWidget key={widget.id} widgetId={widget.id} {...commonProps} onActivity={() => trackFocusActivity('todo')} />;
      case 'timer':
        return <TimerWidget key={widget.id} widgetId={widget.id} {...commonProps} onActivity={(duration) => trackFocusActivity('timer', duration)} />;
      case 'bookmark':
        return <BookmarkWidget key={widget.id} widgetId={widget.id} {...commonProps} />;
      case 'spotify':
        return <SpotifyWidget key={widget.id} widgetId={widget.id} {...commonProps} onActivity={() => trackFocusActivity('spotify')} />;
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
    <>
      <SidebarOverlay 
        isVisible={isSidebarVisible} 
        onToggleVisibility={() => setIsSidebarVisible(!isSidebarVisible)}
      >
        <div className="sidebar-content sidebar-resize-transition">
          {/* Daily Summary Popup */}
          <DailySummaryPopup />

          {/* Workspace Manager */}
          <div className="sidebar-widget" style={{ 
            backgroundColor: 'var(--theme-surface)',
            borderColor: 'var(--theme-border)',
            border: '1px solid'
          }}>
            <WorkspaceManager />
          </div>

          {/* VibeMind AI Assistant */}
          <div className="sidebar-widget" style={{ 
            backgroundColor: 'var(--theme-surface)',
            borderColor: 'var(--theme-border)',
            border: '1px solid'
          }}>
            <VibeMind currentWidget={currentFocusWidget} />
          </div>

          {/* Writer Pad Toggle Button */}
          <div className="sidebar-widget" style={{ 
            backgroundColor: 'var(--theme-surface)',
            borderColor: 'var(--theme-border)',
            border: '1px solid'
          }}>
            <Button
              onClick={() => setIsWriterPadOpen(true)}
              className="w-full flex items-center gap-2 p-3"
              style={{ 
                backgroundColor: 'transparent',
                color: 'var(--theme-text)',
                border: 'none'
              }}
              title="Open Writer Pad (Ctrl+Shift+W)"
            >
              <span className="text-lg">✍️</span>
              <span>Writer Mode</span>
            </Button>
          </div>

          {/* Control Buttons */}
          <div className="sidebar-button-group" style={{ justifyContent: 'flex-end' }}>
            <Button
              onClick={() => setIsNotificationManagerOpen(true)}
              className="sidebar-button relative"
              style={{ 
                backgroundColor: 'var(--theme-surface)',
                color: 'var(--theme-accent)',
                border: `1px solid var(--theme-border)`
              }}
              title="Notifications"
              aria-label={`Notifications ${pendingCount > 0 ? `(${pendingCount} pending)` : ''}`}
            >
              <Bell className="w-4 h-4" />
              {pendingCount > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </div>
              )}
            </Button>
            
            <Button
              onClick={openPluginStore}
              className="sidebar-button"
              style={{ 
                backgroundColor: 'var(--theme-surface)',
                color: 'var(--theme-accent)',
                border: `1px solid var(--theme-border)`
              }}
              title="Plugin Store"
              aria-label="Open Plugin Store"
            >
              <Plug className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => setIsSettingsOpen(true)}
              className="sidebar-button"
              style={{ 
                backgroundColor: 'var(--theme-surface)',
                color: 'var(--theme-accent)',
                border: `1px solid var(--theme-border)`
              }}
              title="Settings (Ctrl+Shift+S)"
              aria-label="Open Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button
              onClick={() => setIsThemeManagerOpen(true)}
              className="sidebar-button"
              style={{ 
                backgroundColor: 'var(--theme-surface)',
                color: 'var(--theme-accent)',
                border: `1px solid var(--theme-border)`
              }}
              title="Theme Manager (Ctrl+Shift+T)"
              aria-label="Open Theme Manager"
            >
              <Palette className="w-4 h-4" />
            </Button>
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
                onVoiceCommand={() => {}}
              />
            </div>
          </div>

          {/* Widget Grid */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="widgets">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex flex-col gap-3"
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
                              sidebar-widget transition-all duration-200
                              ${snapshot.isDragging ? 'shadow-2xl scale-105' : 'shadow-lg'}
                            `}
                            style={{
                              backgroundColor: `var(--theme-surface)`,
                              borderColor: `var(--theme-border)`,
                              border: '1px solid',
                              opacity: `var(--theme-opacity)`,
                              ...provided.draggableProps.style,
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

          {/* Settings Panel */}
          <SettingsPanel
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />

          {/* Notification Toast */}
          <NotificationToast
            notification={currentToast}
            onClose={() => setCurrentToast(null)}
          />

          {/* Notification Manager */}
          <NotificationManager
            isOpen={isNotificationManagerOpen}
            onClose={() => setIsNotificationManagerOpen(false)}
          />

          {/* Command Palette */}
          <CommandPalette
            isOpen={commandPalette.isOpen}
            onClose={commandPalette.close}
            setIsThemeManagerOpen={setIsThemeManagerOpen}
          />
        </div>
      </SidebarOverlay>

      {/* Writer Pad */}
      <WriterPad
        isOpen={isWriterPadOpen}
        onClose={() => setIsWriterPadOpen(false)}
      />
    </>
  );
};

export default WidgetContainer;
