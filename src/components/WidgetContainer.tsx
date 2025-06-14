import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Palette } from 'lucide-react';
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
import { useTheme } from '@/contexts/ThemeContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { Notification } from '@/services/NotificationService';
import CommandPalette from './CommandPalette';
import { useCommandPalette } from '@/hooks/useCommandPalette';

interface Widget {
  id: string;
  type: 'notes' | 'todo' | 'timer' | 'bookmark' | 'spotify' | 'analytics' | 'freespace' | 'notifications';
  order: number;
  enabled: boolean;
}

const WidgetContainer: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isThemeManagerOpen, setIsThemeManagerOpen] = useState(false);
  const [currentToast, setCurrentToast] = useState<Notification | null>(null);
  const { currentTheme, isCustom } = useTheme();
  const { currentWorkspace, updateWorkspace } = useWorkspace();
  const commandPalette = useCommandPalette();

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

    // Update order values
    const updatedWidgets = items.map((widget, index) => ({
      ...widget,
      order: index,
    }));

    setWidgets(updatedWidgets);

    // Update workspace with new widget order
    if (currentWorkspace && updateWorkspace) {
      const activeWidgets = updatedWidgets.map(w => w.id);
      await updateWorkspace(currentWorkspace.id, { activeWidgets });
    }
  };

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'notifications':
        return <NotificationCenter key={widget.id} widgetId={widget.id} />;
      case 'analytics':
        return <LiveAnalyticsWidget key={widget.id} widgetId={widget.id} />;
      case 'freespace':
        return <FreeSpaceWidget key={widget.id} widgetId={widget.id} />;
      case 'notes':
        return <NotesWidget key={widget.id} widgetId={widget.id} />;
      case 'todo':
        return <ToDoWidget key={widget.id} widgetId={widget.id} />;
      case 'timer':
        return <TimerWidget key={widget.id} widgetId={widget.id} />;
      case 'bookmark':
        return <BookmarkWidget key={widget.id} widgetId={widget.id} />;
      case 'spotify':
        return <SpotifyWidget key={widget.id} widgetId={widget.id} />;
      default:
        return null;
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

      {/* Theme Toggle Button */}
      <div className="flex justify-end mb-4">
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
