
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Settings, Copy, Trash2, Edit, FolderOpen } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';

const WorkspaceManager: React.FC = () => {
  const {
    workspaces,
    currentWorkspace,
    switchWorkspace,
    createWorkspace,
    deleteWorkspace,
    duplicateWorkspace,
    updateWorkspace,
    isLoading,
  } = useWorkspace();

  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;
    
    try {
      await createWorkspace(newWorkspaceName.trim());
      setNewWorkspaceName('');
      setIsCreating(false);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  const handleDuplicateWorkspace = async (workspaceId: string, originalName: string) => {
    try {
      await duplicateWorkspace(workspaceId, `${originalName} Copy`);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to duplicate workspace:', error);
    }
  };

  const handleRenameWorkspace = async (workspaceId: string) => {
    if (!editingName.trim()) return;
    
    try {
      await updateWorkspace(workspaceId, { name: editingName.trim() });
      setEditingId(null);
      setEditingName('');
    } catch (error) {
      console.error('Failed to rename workspace:', error);
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (workspaces.length <= 1) return; // Don't delete the last workspace
    
    try {
      await deleteWorkspace(workspaceId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    }
  };

  return (
    <div className="relative">
      {/* Workspace Selector Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:scale-[1.02]"
        style={{ 
          backgroundColor: 'var(--theme-surface)',
          color: 'var(--theme-text)',
          border: `1px solid var(--theme-border)`
        }}
        disabled={isLoading}
      >
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          <span className="font-medium">
            {currentWorkspace?.name || 'Default'}
          </span>
          {currentWorkspace?.shortcutKey && (
            <span 
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ 
                backgroundColor: 'var(--theme-accent)20',
                color: 'var(--theme-accent)'
              }}
            >
              ⌘{currentWorkspace.shortcutKey}
            </span>
          )}
        </div>
        <ChevronDown 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 rounded-lg shadow-2xl z-50 border backdrop-blur-sm"
            style={{ 
              backgroundColor: 'var(--theme-surface)',
              borderColor: 'var(--theme-border)'
            }}
          >
            <div className="p-2 max-h-80 overflow-y-auto">
              {/* Workspace List */}
              {workspaces.map((workspace) => (
                <div key={workspace.id} className="group">
                  {editingId === workspace.id ? (
                    <div className="flex items-center gap-2 p-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameWorkspace(workspace.id);
                          if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditingName('');
                          }
                        }}
                        className="flex-1 px-2 py-1 text-sm rounded border"
                        style={{
                          backgroundColor: 'var(--theme-background)',
                          borderColor: 'var(--theme-border)',
                          color: 'var(--theme-text)'
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => handleRenameWorkspace(workspace.id)}
                        className="p-1 rounded hover:bg-green-500/20 text-green-400"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        currentWorkspace?.id === workspace.id ? 'bg-blue-500/20' : 'hover:bg-gray-700/50'
                      }`}
                      onClick={() => {
                        switchWorkspace(workspace.id);
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--theme-text)' }}>
                          {workspace.name}
                        </span>
                        {workspace.shortcutKey && (
                          <span 
                            className="text-xs px-1 py-0.5 rounded"
                            style={{ 
                              backgroundColor: 'var(--theme-accent)20',
                              color: 'var(--theme-accent)'
                            }}
                          >
                            ⌘{workspace.shortcutKey}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(workspace.id);
                            setEditingName(workspace.name);
                          }}
                          className="p-1 rounded hover:bg-blue-500/20"
                          style={{ color: 'var(--theme-text-secondary)' }}
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateWorkspace(workspace.id, workspace.name);
                          }}
                          className="p-1 rounded hover:bg-green-500/20"
                          style={{ color: 'var(--theme-text-secondary)' }}
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {workspaces.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWorkspace(workspace.id);
                            }}
                            className="p-1 rounded hover:bg-red-500/20 text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Create New Workspace */}
              <div className="border-t pt-2 mt-2" style={{ borderColor: 'var(--theme-border)' }}>
                {isCreating ? (
                  <div className="flex items-center gap-2 p-2">
                    <input
                      type="text"
                      value={newWorkspaceName}
                      onChange={(e) => setNewWorkspaceName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateWorkspace();
                        if (e.key === 'Escape') {
                          setIsCreating(false);
                          setNewWorkspaceName('');
                        }
                      }}
                      placeholder="Workspace name..."
                      className="flex-1 px-2 py-1 text-sm rounded border"
                      style={{
                        backgroundColor: 'var(--theme-background)',
                        borderColor: 'var(--theme-border)',
                        color: 'var(--theme-text)'
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleCreateWorkspace}
                      className="p-1 rounded hover:bg-green-500/20 text-green-400"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg transition-colors hover:bg-gray-700/50"
                    style={{ color: 'var(--theme-text-secondary)' }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Workspace</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkspaceManager;
