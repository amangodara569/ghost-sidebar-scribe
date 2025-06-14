
import React, { useState, useEffect, useCallback } from 'react';
import { createEditor, Descendant, Editor, Transforms, Element as SlateElement } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Note {
  id: string;
  content: Descendant[];
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesWidgetProps {
  widgetId: string;
  className?: string;
}

const NotesWidget: React.FC<NotesWidgetProps> = ({ widgetId, className }) => {
  const [editor] = useState(() => withHistory(withReact(createEditor())));
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const initialValue: Descendant[] = [
    {
      children: [{ text: 'Start typing your note...' }],
    },
  ];

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      if (window.electronAPI) {
        const storedNotes = await window.electronAPI.invoke('notes:getAll');
        setNotes(storedNotes || []);
        if (storedNotes && storedNotes.length > 0) {
          setActiveNote(storedNotes[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const saveNote = async (note: Note) => {
    try {
      if (window.electronAPI) {
        const savedNote = await window.electronAPI.invoke('notes:save', note);
        setNotes(prev => {
          const existing = prev.find(n => n.id === savedNote.id);
          if (existing) {
            return prev.map(n => n.id === savedNote.id ? savedNote : n);
          }
          return [savedNote, ...prev];
        });
        return savedNote;
      }
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const createNewNote = () => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: 'New Note',
      content: initialValue,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveNote(newNote);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (activeNote) {
      const updatedNote = {
        ...activeNote,
        content: editor.children,
        updatedAt: new Date().toISOString(),
      };
      saveNote(updatedNote);
      setActiveNote(updatedNote);
      setIsEditing(false);
    }
  };

  const renderElement = useCallback((props: any) => {
    return <DefaultElement {...props} />;
  }, []);

  const renderLeaf = useCallback((props: any) => {
    return <Leaf {...props} />;
  }, []);

  return (
    <div className={`${className || ''} sidebar-widget-content`}>
      <div className="sidebar-widget-header">
        <h3 className="sidebar-widget-title">Notes</h3>
        <div className="sidebar-button-group">
          <Button
            size="sm"
            variant="outline"
            onClick={createNewNote}
            className="sidebar-button"
            style={{
              backgroundColor: 'var(--theme-surface)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)'
            }}
          >
            New
          </Button>
          {isEditing && (
            <Button
              size="sm"
              onClick={handleSave}
              className="sidebar-button"
              style={{
                backgroundColor: 'var(--theme-accent)',
                color: 'white',
                border: 'none'
              }}
            >
              Save
            </Button>
          )}
        </div>
      </div>
      
      <div className="sidebar-widget-content">
        {activeNote ? (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => setActiveNote({ ...activeNote, title: e.target.value })}
              className="sidebar-input"
              style={{
                backgroundColor: 'var(--theme-background)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text)',
                border: '1px solid'
              }}
              placeholder="Note title..."
            />
            <div 
              className="min-h-[120px] rounded border p-3"
              style={{
                backgroundColor: 'var(--theme-background)',
                borderColor: 'var(--theme-border)',
                border: '1px solid'
              }}
            >
              <Slate
                editor={editor}
                initialValue={activeNote.content}
                onChange={() => setIsEditing(true)}
              >
                <Editable
                  renderElement={renderElement}
                  renderLeaf={renderLeaf}
                  placeholder="Start typing your note..."
                  className="sidebar-text focus:outline-none min-h-[100px]"
                  style={{ color: 'var(--theme-text)' }}
                />
              </Slate>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="sidebar-text-secondary">No notes yet. Create your first note!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const DefaultElement = (props: any) => {
  return <p {...props.attributes} className="sidebar-text">{props.children}</p>;
};

const Leaf = (props: any) => {
  return (
    <span
      {...props.attributes}
      style={{ fontWeight: props.leaf.bold ? 'bold' : 'normal' }}
      className="sidebar-text"
    >
      {props.children}
    </span>
  );
};

export default NotesWidget;
