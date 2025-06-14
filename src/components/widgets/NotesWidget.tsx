
import React, { useState, useEffect, useCallback } from 'react';
import { createEditor, Descendant, Editor, Transforms, Element as SlateElement } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Mic, MicOff } from 'lucide-react';
import AINotesContextMenu from '../AINotesContextMenu';
import AIPreviewModal from '../AIPreviewModal';
import { aiNotesService } from '@/services/aiNoteService';
import { toast } from 'sonner';

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
  onActivity?: () => void;
}

const NotesWidget: React.FC<NotesWidgetProps> = ({ widgetId, className, onActivity }) => {
  const [editor] = useState(() => withHistory(withReact(createEditor())));
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // AI features
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiAction, setAiAction] = useState<string>('');
  const [aiResult, setAiResult] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string>('');
  
  // Voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

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
      
      onActivity?.();
    }
  };

  // Get note content as plain text for AI processing
  const getNoteText = (): string => {
    if (!activeNote) return '';
    return editor.children
      .map(node => {
        if ('children' in node) {
          return node.children.map(child => ('text' in child ? child.text : '')).join('');
        }
        return '';
      })
      .join('\n')
      .trim();
  };

  // AI Actions
  const handleAIAction = async (action: 'summarize' | 'rephrase' | 'convert-todos') => {
    const noteText = getNoteText();
    if (!noteText) {
      toast.error('No content to process');
      return;
    }

    setAiAction(action);
    setAiModalOpen(true);
    setAiLoading(true);
    setAiError('');

    try {
      let result;
      switch (action) {
        case 'summarize':
          result = await aiNotesService.summarizeNote(noteText);
          break;
        case 'rephrase':
          result = await aiNotesService.rephraseForClarity(noteText);
          break;
        case 'convert-todos':
          result = await aiNotesService.convertToTodos(noteText);
          break;
      }

      if (result.success) {
        setAiResult(result.content);
      } else {
        setAiError(result.error || 'AI processing failed');
      }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAcceptAIResult = (content: string) => {
    if (activeNote) {
      // Convert the AI result back to Slate format
      const newContent: Descendant[] = content.split('\n').map(line => ({
        children: [{ text: line }]
      }));

      // Update the editor content
      editor.children = newContent;
      Editor.normalize(editor, { force: true });

      // Update the note
      const updatedNote = {
        ...activeNote,
        content: newContent,
        updatedAt: new Date().toISOString(),
      };
      
      setActiveNote(updatedNote);
      setIsEditing(true);
      toast.success('AI changes applied');
    }
  };

  // Voice to Note
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        await processVoiceRecording(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success('Recording started...');
    } catch (error) {
      toast.error('Failed to access microphone');
      console.error('Voice recording error:', error);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const processVoiceRecording = async (audioBlob: Blob) => {
    // For now, we'll use a mock transcript
    // In a real implementation, you'd use a speech-to-text service
    const mockTranscript = "This is a voice-generated note from the recording.";
    
    setAiAction('voice-to-note');
    setAiModalOpen(true);
    setAiLoading(true);
    setAiError('');

    try {
      const result = await aiNotesService.generateFromVoice(mockTranscript);
      
      if (result.success) {
        setAiResult(result.content);
      } else {
        setAiError(result.error || 'Voice processing failed');
      }
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setAiLoading(false);
    }
  };

  const renderElement = useCallback((props: any) => {
    return <DefaultElement {...props} />;
  }, []);

  const renderLeaf = useCallback((props: any) => {
    return <Leaf {...props} />;
  }, []);

  const getAIModalTitle = () => {
    switch (aiAction) {
      case 'summarize':
        return 'AI Summary';
      case 'rephrase':
        return 'AI Rephrase';
      case 'convert-todos':
        return 'Convert to TODOs';
      case 'voice-to-note':
        return 'Voice to Note';
      default:
        return 'AI Assistant';
    }
  };

  return (
    <div className={`${className || ''} sidebar-widget-content`}>
      <div className="sidebar-widget-header">
        <h3 className="sidebar-widget-title">Notes</h3>
        <div className="sidebar-button-group">
          <Button
            size="sm"
            variant="outline"
            onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
            className="sidebar-button"
            style={{
              backgroundColor: isRecording ? 'var(--theme-accent)' : 'var(--theme-surface)',
              borderColor: 'var(--theme-border)',
              color: isRecording ? 'white' : 'var(--theme-text)'
            }}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>
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
            
            <AINotesContextMenu
              onSummarize={() => handleAIAction('summarize')}
              onRephrase={() => handleAIAction('rephrase')}
              onConvertToTodos={() => handleAIAction('convert-todos')}
              onVoiceToNote={startVoiceRecording}
              disabled={!getNoteText()}
            >
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
                    placeholder="Start typing your note... (Right-click for AI options)"
                    className="sidebar-text focus:outline-none min-h-[100px]"
                    style={{ color: 'var(--theme-text)' }}
                  />
                </Slate>
              </div>
            </AINotesContextMenu>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="sidebar-text-secondary">No notes yet. Create your first note!</p>
          </div>
        )}
      </div>

      <AIPreviewModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onAccept={handleAcceptAIResult}
        title={getAIModalTitle()}
        originalContent={getNoteText()}
        aiContent={aiResult}
        isLoading={aiLoading}
        error={aiError}
      />
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
