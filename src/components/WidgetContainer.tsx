
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
import ThemeManager from './ThemeManager';
import { useTheme } from '@/contexts/ThemeContext';

interface Widget {
  id: string;
  type: 'notes' | 'todo' | 'timer' | 'bookmark' | 'spotify' | 'analytics' | 'freespace';
  order: number;
  enabled: boolean;
}

const WidgetContainer: React.FC = () => {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isThemeManagerOpen, setIsThemeManagerOpen] = useState(false);
  const { currentTheme, isCustom } = useTheme();

  useEffect(() => {
    // Load widget configuration from storage
    loadWidgets();
  }, []);

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

  const loadWidgets = async () => {
    try {
      // Use IPC to get widgets from storage
      if (window.electronAPI) {
        const storedWidgets = await window.electronAPI.invoke('widgets:getAll');
        setWidgets(storedWidgets || getDefaultWidgets());
      } else {
        setWidgets(getDefaultWidgets());
      }
    } catch (error) {
      console.error('Failed to load widgets:', error);
      setWidgets(getDefaultWidgets());
    }
  };

  const getDefaultWidgets = (): Widget[] => [
    { id: 'analytics-1', type: 'analytics', order: 0, enabled: true },
    { id: 'freespace-1', type: 'freespace', order: 1, enabled: true },
    { id: 'notes-1', type: 'notes', order: 2, enabled: true },
    { id: 'todo-1', type: 'todo', order: 3, enabled: true },
    { id: 'timer-1', type: 'timer', order: 4, enabled: true },
    { id: 'bookmark-1', type: 'bookmark', order: 5, enabled: true },
    { id: 'spotify-1', type: 'spotify', order: 6, enabled: true },
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

    // Persist to storage
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('widgets:updateOrder', updatedWidgets);
      }
    } catch (error) {
      console.error('Failed to save widget order:', error);
    }
  };

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
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
    </div>
  );
};

export default WidgetContainer;
