
import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useTheme } from './ThemeContext';

export interface Workspace {
  id: string;
  name: string;
  themeId?: string;
  isCustomTheme?: boolean;
  customTheme?: any;
  activeWidgets: string[];
  freespaceTabId?: string;
  todoListId?: string;
  createdAt: string;
  lastUsed: string;
  shortcutKey?: number; // 1-9 for Ctrl+1-9
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace | null;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (name: string) => Promise<string>;
  updateWorkspace: (workspaceId: string, updates: Partial<Workspace>) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  duplicateWorkspace: (workspaceId: string, newName: string) => Promise<string>;
  loadWorkspaces: () => Promise<void>;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { setTheme, setCustomTheme, presets } = useTheme();

  useEffect(() => {
    loadWorkspaces();
    setupKeyboardShortcuts();
  }, []);

  const setupKeyboardShortcuts = () => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key >= '1' && event.key <= '9') {
        event.preventDefault();
        const shortcutNumber = parseInt(event.key);
        const targetWorkspace = workspaces.find(w => w.shortcutKey === shortcutNumber);
        if (targetWorkspace) {
          switchWorkspace(targetWorkspace.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  };

  const loadWorkspaces = async () => {
    setIsLoading(true);
    try {
      if (window.electronAPI) {
        const stored = await window.electronAPI.invoke('workspace:getAll');
        const loadedWorkspaces = stored || [];
        setWorkspaces(loadedWorkspaces);
        
        // Load last used workspace or create default
        const lastUsed = loadedWorkspaces.find(w => w.lastUsed) || loadedWorkspaces[0];
        if (lastUsed) {
          await switchWorkspace(lastUsed.id, false);
        } else if (loadedWorkspaces.length === 0) {
          // Create default workspace
          await createDefaultWorkspace();
        }
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
      await createDefaultWorkspace();
    }
    setIsLoading(false);
  };

  const createDefaultWorkspace = async () => {
    const defaultWorkspace: Workspace = {
      id: 'default',
      name: 'Default',
      activeWidgets: ['notifications-1', 'analytics-1', 'freespace-1', 'notes-1', 'todo-1', 'timer-1'],
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      shortcutKey: 1,
    };
    
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('workspace:save', defaultWorkspace);
      }
      setWorkspaces([defaultWorkspace]);
      setCurrentWorkspace(defaultWorkspace);
    } catch (error) {
      console.error('Failed to create default workspace:', error);
    }
  };

  const switchWorkspace = async (workspaceId: string, showToast = true) => {
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (!workspace) return;

    setIsLoading(true);
    try {
      // Update last used timestamp
      const updatedWorkspace = {
        ...workspace,
        lastUsed: new Date().toISOString(),
      };

      // Apply theme
      if (workspace.isCustomTheme && workspace.customTheme) {
        setCustomTheme(workspace.customTheme);
      } else if (workspace.themeId) {
        const theme = presets.find(p => p.id === workspace.themeId);
        if (theme) {
          setTheme(theme);
        }
      }

      // Update workspace
      await updateWorkspace(workspaceId, { lastUsed: updatedWorkspace.lastUsed });
      setCurrentWorkspace(updatedWorkspace);

      // Emit event for widgets to update
      window.dispatchEvent(new CustomEvent('workspace:switched', {
        detail: updatedWorkspace
      }));

      if (showToast) {
        toast.success(`Switched to ${workspace.name}`, {
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Failed to switch workspace:', error);
      toast.error('Failed to switch workspace');
    }
    setIsLoading(false);
  };

  const createWorkspace = async (name: string): Promise<string> => {
    const id = `workspace_${Date.now()}`;
    const newWorkspace: Workspace = {
      id,
      name,
      activeWidgets: currentWorkspace?.activeWidgets || ['notifications-1', 'analytics-1', 'freespace-1'],
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      shortcutKey: workspaces.length + 1 <= 9 ? workspaces.length + 1 : undefined,
    };

    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('workspace:save', newWorkspace);
      }
      setWorkspaces(prev => [...prev, newWorkspace]);
      toast.success(`Created workspace "${name}"`);
      return id;
    } catch (error) {
      console.error('Failed to create workspace:', error);
      toast.error('Failed to create workspace');
      throw error;
    }
  };

  const updateWorkspace = async (workspaceId: string, updates: Partial<Workspace>) => {
    try {
      const updatedWorkspace = workspaces.find(w => w.id === workspaceId);
      if (!updatedWorkspace) return;

      const newWorkspace = { ...updatedWorkspace, ...updates };
      
      if (window.electronAPI) {
        await window.electronAPI.invoke('workspace:save', newWorkspace);
      }
      
      setWorkspaces(prev => prev.map(w => w.id === workspaceId ? newWorkspace : w));
      
      if (currentWorkspace?.id === workspaceId) {
        setCurrentWorkspace(newWorkspace);
      }
    } catch (error) {
      console.error('Failed to update workspace:', error);
      toast.error('Failed to update workspace');
    }
  };

  const deleteWorkspace = async (workspaceId: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('workspace:delete', workspaceId);
      }
      
      setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
      
      if (currentWorkspace?.id === workspaceId) {
        const remainingWorkspaces = workspaces.filter(w => w.id !== workspaceId);
        if (remainingWorkspaces.length > 0) {
          await switchWorkspace(remainingWorkspaces[0].id);
        }
      }
      
      toast.success('Workspace deleted');
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      toast.error('Failed to delete workspace');
    }
  };

  const duplicateWorkspace = async (workspaceId: string, newName: string): Promise<string> => {
    const originalWorkspace = workspaces.find(w => w.id === workspaceId);
    if (!originalWorkspace) throw new Error('Workspace not found');

    const id = `workspace_${Date.now()}`;
    const duplicatedWorkspace: Workspace = {
      ...originalWorkspace,
      id,
      name: newName,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      shortcutKey: workspaces.length + 1 <= 9 ? workspaces.length + 1 : undefined,
    };

    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('workspace:save', duplicatedWorkspace);
      }
      setWorkspaces(prev => [...prev, duplicatedWorkspace]);
      toast.success(`Duplicated workspace as "${newName}"`);
      return id;
    } catch (error) {
      console.error('Failed to duplicate workspace:', error);
      toast.error('Failed to duplicate workspace');
      throw error;
    }
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      currentWorkspace,
      switchWorkspace,
      createWorkspace,
      updateWorkspace,
      deleteWorkspace,
      duplicateWorkspace,
      loadWorkspaces,
      isLoading,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
