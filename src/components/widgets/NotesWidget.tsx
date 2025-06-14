
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
}

const NotesWidget: React.FC<NotesWidgetProps> = ({ widgetId }) => {
  const [editor] = useState(() => withHistory(withReact(createEditor())));
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const initialValue: Descendant[] = [
    {
      type: 'paragraph',
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
    <Card className="bg-transparent border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-100">Notes</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={createNewNote}
              className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
            >
              New
            </Button>
            {isEditing && (
              <Button
                size="sm"
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Save
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {activeNote ? (
          <div className="space-y-3">
            <input
              type="text"
              value={activeNote.title}
              onChange={(e) => setActiveNote({ ...activeNote, title: e.target.value })}
              className="w-full bg-gray-800 border-gray-600 text-gray-100 px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Note title..."
            />
            <div className="min-h-[120px] bg-gray-800 border border-gray-600 rounded p-3">
              <Slate
                editor={editor}
                initialValue={activeNote.content}
                onChange={() => setIsEditing(true)}
              >
                <Editable
                  renderElement={renderElement}
                  renderLeaf={renderLeaf}
                  placeholder="Start typing your note..."
                  className="text-gray-200 focus:outline-none min-h-[100px]"
                />
              </Slate>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p>No notes yet. Create your first note!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const DefaultElement = (props: any) => {
  return <p {...props.attributes}>{props.children}</p>;
};

const Leaf = (props: any) => {
  return (
    <span
      {...props.attributes}
      style={{ fontWeight: props.leaf.bold ? 'bold' : 'normal' }}
    >
      {props.children}
    </span>
  );
};

export default NotesWidget;
