
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Pin, PinOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface StickyNote {
  id: string;
  title: string;
  content: string;
  x: number;
  y: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StickyNotesWidgetProps {
  widgetId: string;
  className?: string;
}

const StickyNotesWidget: React.FC<StickyNotesWidgetProps> = ({ widgetId, className }) => {
  const [notes, setNotes] = useLocalStorage<StickyNote[]>('sticky-notes', []);
  const [draggedNote, setDraggedNote] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-save timer
  const autoSaveTimer = useRef<NodeJS.Timeout>();

  const createNewNote = () => {
    const newNote: StickyNote = {
      id: `note-${Date.now()}`,
      title: '',
      content: '',
      x: Math.random() * 200, // Random initial position
      y: Math.random() * 100,
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotes(prev => [...prev, newNote]);
  };

  const updateNote = (id: string, updates: Partial<StickyNote>) => {
    // Clear existing timer
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }

    // Set new timer for auto-save
    autoSaveTimer.current = setTimeout(() => {
      setNotes(prev => prev.map(note => 
        note.id === id 
          ? { ...note, ...updates, updatedAt: new Date().toISOString() }
          : note
      ));
    }, 1000);
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const togglePin = (id: string) => {
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, isPinned: !note.isPinned, updatedAt: new Date().toISOString() }
        : note
    ));
  };

  const handleMouseDown = (e: React.MouseEvent, noteId: string) => {
    if ((e.target as HTMLElement).closest('textarea, input, button')) return;
    
    e.preventDefault();
    setDraggedNote(noteId);
    
    const note = notes.find(n => n.id === noteId);
    if (note && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - note.x,
        y: e.clientY - rect.top - note.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggedNote || !containerRef.current) return;
    
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - 200));
    const newY = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 150));
    
    setNotes(prev => prev.map(note => 
      note.id === draggedNote 
        ? { ...note, x: newX, y: newY, updatedAt: new Date().toISOString() }
        : note
    ));
  };

  const handleMouseUp = () => {
    setDraggedNote(null);
  };

  useEffect(() => {
    if (draggedNote) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [draggedNote, dragOffset]);

  // Sort notes: pinned first, then by creation date
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Card className={`${className || ''} relative overflow-hidden`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Sticky Notes</span>
          <Button
            size="sm"
            onClick={createNewNote}
            className="h-6 w-6 p-0"
            style={{
              backgroundColor: 'var(--theme-accent)',
              color: 'white',
              border: 'none'
            }}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 relative h-80 overflow-hidden" ref={containerRef}>
        <AnimatePresence>
          {sortedNotes.map((note) => (
            <motion.div
              key={note.id}
              className="absolute select-none cursor-move"
              style={{
                left: note.x,
                top: note.y,
                width: '180px',
                zIndex: note.isPinned ? 20 : 10
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              onMouseDown={(e) => handleMouseDown(e, note.id)}
            >
              <div 
                className="rounded-lg border shadow-sm p-2 backdrop-blur-sm transition-all duration-200 hover:shadow-md"
                style={{
                  backgroundColor: 'rgba(40, 40, 40, 0.5)',
                  borderColor: note.isPinned ? 'var(--theme-accent)' : 'rgba(255, 255, 255, 0.08)',
                  borderWidth: note.isPinned ? '2px' : '1px',
                  boxShadow: note.isPinned ? '0 0 8px rgba(59, 130, 246, 0.3)' : undefined
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <input
                    type="text"
                    value={note.title}
                    onChange={(e) => updateNote(note.id, { title: e.target.value })}
                    placeholder="Note title..."
                    className="text-sm font-bold bg-transparent border-none outline-none flex-1 mr-1"
                    style={{ color: 'var(--theme-text)' }}
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => togglePin(note.id)}
                      className="h-4 w-4 p-0 opacity-60 hover:opacity-100"
                      style={{ color: note.isPinned ? 'var(--theme-accent)' : 'var(--theme-text-secondary)' }}
                    >
                      {note.isPinned ? <Pin className="w-3 h-3" /> : <PinOff className="w-3 h-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteNote(note.id)}
                      className="h-4 w-4 p-0 opacity-60 hover:opacity-100 hover:text-red-400"
                      style={{ color: 'var(--theme-text-secondary)' }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Content */}
                <Textarea
                  value={note.content}
                  onChange={(e) => updateNote(note.id, { content: e.target.value })}
                  placeholder="Start typing..."
                  className="text-xs resize-none border-none bg-transparent p-0 min-h-[60px] max-h-[100px] focus-visible:ring-0"
                  style={{ 
                    color: 'var(--theme-text)',
                    fontSize: '12px'
                  }}
                />
                
                {/* Timestamp */}
                <div className="text-xs opacity-40 mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
                  {new Date(note.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {notes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm opacity-60" style={{ color: 'var(--theme-text-secondary)' }}>
              Click + to create your first sticky note
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StickyNotesWidget;
