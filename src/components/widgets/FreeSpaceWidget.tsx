
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Tab } from '@headlessui/react';
import MDEditor from '@uiw/react-md-editor';
import { Plus, X, Edit2, FileText, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import '@uiw/react-md-editor/markdown-editor.css';
import 'highlight.js/styles/github-dark.css';

interface FreeSpace {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const FreeSpaceWidget: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  const [spaces, setSpaces] = useState<FreeSpace[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSpaces();
  }, []);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const loadSpaces = async () => {
    try {
      if (window.electronAPI) {
        const loadedSpaces = await window.electronAPI.invoke('freespace:getAll');
        if (loadedSpaces.length === 0) {
          // Create default space if none exist
          const defaultSpace = await createNewSpace('Welcome');
          setSpaces([defaultSpace]);
        } else {
          setSpaces(loadedSpaces);
        }
      } else {
        // Fallback for non-electron environment
        const defaultSpace: FreeSpace = {
          id: 'default',
          title: 'Welcome',
          content: '# Welcome to FreeSpace\n\nStart writing your thoughts here...\n\n## Features\n- Markdown support\n- Live preview\n- Autosave\n- Multiple canvases',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setSpaces([defaultSpace]);
      }
    } catch (error) {
      console.error('Failed to load freespaces:', error);
      toast.error('Failed to load writing spaces');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewSpace = async (title: string = 'New Space'): Promise<FreeSpace> => {
    const newSpace: FreeSpace = {
      id: Date.now().toString(),
      title,
      content: `# ${title}\n\nStart writing here...`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('freespace:save', newSpace);
      }
      return newSpace;
    } catch (error) {
      console.error('Failed to create new space:', error);
      toast.error('Failed to create new space');
      return newSpace;
    }
  };

  const saveSpace = useCallback(async (space: FreeSpace) => {
    try {
      setIsSaving(true);
      if (window.electronAPI) {
        await window.electronAPI.invoke('freespace:save', {
          ...space,
          updated_at: new Date().toISOString()
        });
      }
      console.log('Space saved:', space.title);
    } catch (error) {
      console.error('Failed to save space:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, []);

  const scheduleAutosave = useCallback((space: FreeSpace) => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    
    autosaveTimerRef.current = setTimeout(() => {
      saveSpace(space);
    }, 5000);
  }, [saveSpace]);

  const handleContentChange = (value: string = '') => {
    if (spaces.length === 0) return;
    
    const updatedSpace = {
      ...spaces[selectedIndex],
      content: value,
      updated_at: new Date().toISOString()
    };
    
    const updatedSpaces = [...spaces];
    updatedSpaces[selectedIndex] = updatedSpace;
    setSpaces(updatedSpaces);
    
    scheduleAutosave(updatedSpace);
  };

  const handleAddSpace = async () => {
    const newSpace = await createNewSpace();
    setSpaces(prev => [...prev, newSpace]);
    setSelectedIndex(spaces.length);
    toast.success('New space created');
  };

  const handleDeleteSpace = async (index: number) => {
    if (spaces.length <= 1) {
      toast.error('Cannot delete the last space');
      return;
    }

    const spaceToDelete = spaces[index];
    
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('freespace:delete', spaceToDelete.id);
      }
      
      const updatedSpaces = spaces.filter((_, i) => i !== index);
      setSpaces(updatedSpaces);
      
      if (selectedIndex >= updatedSpaces.length) {
        setSelectedIndex(updatedSpaces.length - 1);
      } else if (selectedIndex > index) {
        setSelectedIndex(selectedIndex - 1);
      }
      
      toast.success('Space deleted');
    } catch (error) {
      console.error('Failed to delete space:', error);
      toast.error('Failed to delete space');
    }
  };

  const handleTitleEdit = async (index: number, newTitle: string) => {
    if (!newTitle.trim()) return;
    
    const updatedSpace = {
      ...spaces[index],
      title: newTitle.trim(),
      updated_at: new Date().toISOString()
    };
    
    const updatedSpaces = [...spaces];
    updatedSpaces[index] = updatedSpace;
    setSpaces(updatedSpaces);
    
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('freespace:save', updatedSpace);
      }
      toast.success('Title updated');
    } catch (error) {
      console.error('Failed to update title:', error);
      toast.error('Failed to update title');
    }
    
    setIsEditingTitle(null);
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="h-64 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const currentSpace = spaces[selectedIndex];

  return (
    <div className="p-4 h-full flex flex-col min-h-[600px]">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">FreeSpace</h3>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="p-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
            title={previewMode ? 'Show Editor' : 'Preview Only'}
          >
            {previewMode ? <Edit2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          {isSaving && (
            <div className="flex items-center gap-1 text-xs text-blue-400">
              <Save className="w-3 h-3 animate-pulse" />
              Saving...
            </div>
          )}
        </div>
      </div>

      <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
        <div className="flex items-center gap-2 mb-4">
          <Tab.List className="flex gap-1 flex-1 overflow-x-auto">
            {spaces.map((space, index) => (
              <Tab key={space.id} className="flex-shrink-0">
                {({ selected }) => (
                  <div className={`
                    flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium
                    transition-colors cursor-pointer
                    ${selected 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                    }
                  `}>
                    {isEditingTitle === space.id ? (
                      <input
                        ref={titleInputRef}
                        type="text"
                        defaultValue={space.title}
                        className="bg-transparent outline-none w-20"
                        onBlur={(e) => handleTitleEdit(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTitleEdit(index, e.currentTarget.value);
                          } else if (e.key === 'Escape') {
                            setIsEditingTitle(null);
                          }
                        }}
                      />
                    ) : (
                      <span
                        onDoubleClick={() => setIsEditingTitle(space.id)}
                        className="truncate max-w-20"
                        title={space.title}
                      >
                        {space.title}
                      </span>
                    )}
                    {spaces.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSpace(index);
                        }}
                        className="p-0.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"
                        title="Delete space"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </Tab>
            ))}
          </Tab.List>
          <button
            onClick={handleAddSpace}
            className="flex-shrink-0 p-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors"
            title="Add new space"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <Tab.Panels className="flex-1 min-h-0">
          {spaces.map((space, index) => (
            <Tab.Panel key={space.id} className="h-full">
              <div className="h-full">
                <MDEditor
                  value={space.content}
                  onChange={handleContentChange}
                  preview={previewMode ? 'preview' : 'edit'}
                  hideToolbar={false}
                  visibleDragBar={false}
                  textareaProps={{
                    placeholder: 'Start writing your thoughts...',
                    style: {
                      fontSize: 14,
                      lineHeight: 1.6,
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                    },
                  }}
                  data-color-mode="dark"
                  height={previewMode ? 400 : 350}
                />
                <div className="mt-2 text-xs text-gray-400 flex justify-between">
                  <span>
                    Last updated: {dayjs(space.updated_at).format('MMM D, h:mm A')}
                  </span>
                  <span>
                    {space.content.length} characters
                  </span>
                </div>
              </div>
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default FreeSpaceWidget;
