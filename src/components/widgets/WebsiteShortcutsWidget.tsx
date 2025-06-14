
import React, { useState, useEffect } from 'react';
import { Plus, Globe, Edit2, Trash2, Folder, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Shortcut {
  id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
  group: string;
  isPinned: boolean;
  favicon?: string;
}

interface Group {
  id: string;
  name: string;
  color: string;
}

interface WebsiteShortcutsWidgetProps {
  widgetId: string;
  className?: string;
}

const defaultGroups: Group[] = [
  { id: 'work', name: 'Work', color: 'bg-blue-500' },
  { id: 'learning', name: 'Learning', color: 'bg-green-500' },
  { id: 'ai', name: 'AI', color: 'bg-purple-500' },
  { id: 'general', name: 'General', color: 'bg-gray-500' },
];

const colorOptions = [
  { value: 'bg-blue-500', label: 'Blue', color: '#3b82f6' },
  { value: 'bg-green-500', label: 'Green', color: '#10b981' },
  { value: 'bg-purple-500', label: 'Purple', color: '#8b5cf6' },
  { value: 'bg-pink-500', label: 'Pink', color: '#ec4899' },
  { value: 'bg-orange-500', label: 'Orange', color: '#f97316' },
  { value: 'bg-red-500', label: 'Red', color: '#ef4444' },
  { value: 'bg-gray-500', label: 'Gray', color: '#6b7280' },
];

const iconOptions = [
  '🌐', '💼', '📚', '🤖', '📊', '💻', '🎯', '⚡', '🔥', '💡',
  '🎨', '📝', '🎵', '📱', '🛒', '🎮', '📧', '🔧', '⭐', '🚀'
];

const WebsiteShortcutsWidget: React.FC<WebsiteShortcutsWidgetProps> = ({ widgetId, className }) => {
  const [shortcuts, setShortcuts] = useLocalStorage<Shortcut[]>('website-shortcuts', []);
  const [groups, setGroups] = useLocalStorage<Group[]>('shortcut-groups', defaultGroups);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['general']));
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    icon: '🌐',
    color: 'bg-blue-500',
    group: 'general',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      icon: '🌐',
      color: 'bg-blue-500',
      group: 'general',
    });
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  const handleAddShortcut = () => {
    if (!formData.name || !formData.url) {
      toast.error('Please fill in all required fields');
      return;
    }

    let processedUrl = formData.url;
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }

    const newShortcut: Shortcut = {
      id: Date.now().toString(),
      name: formData.name,
      url: processedUrl,
      icon: formData.icon,
      color: formData.color,
      group: formData.group,
      isPinned: false,
      favicon: getFaviconUrl(processedUrl) || undefined,
    };

    setShortcuts(prev => [...prev, newShortcut]);
    resetForm();
    setIsAddModalOpen(false);
    toast.success('Shortcut added successfully!');
  };

  const handleEditShortcut = () => {
    if (!editingShortcut || !formData.name || !formData.url) {
      toast.error('Please fill in all required fields');
      return;
    }

    let processedUrl = formData.url;
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }

    const updatedShortcut: Shortcut = {
      ...editingShortcut,
      name: formData.name,
      url: processedUrl,
      icon: formData.icon,
      color: formData.color,
      group: formData.group,
      favicon: getFaviconUrl(processedUrl) || undefined,
    };

    setShortcuts(prev => prev.map(s => s.id === editingShortcut.id ? updatedShortcut : s));
    setEditingShortcut(null);
    resetForm();
    toast.success('Shortcut updated successfully!');
  };

  const handleDeleteShortcut = (id: string) => {
    setShortcuts(prev => prev.filter(s => s.id !== id));
    toast.success('Shortcut deleted');
  };

  const togglePin = (id: string) => {
    setShortcuts(prev => prev.map(s => 
      s.id === id ? { ...s, isPinned: !s.isPinned } : s
    ));
  };

  const openShortcut = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const startEdit = (shortcut: Shortcut) => {
    setEditingShortcut(shortcut);
    setFormData({
      name: shortcut.name,
      url: shortcut.url,
      icon: shortcut.icon,
      color: shortcut.color,
      group: shortcut.group,
    });
  };

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleDragStart = (e: React.DragEvent, shortcut: Shortcut) => {
    e.dataTransfer.setData('text/uri-list', shortcut.url);
    e.dataTransfer.setData('text/plain', shortcut.url);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const pinnedShortcuts = shortcuts.filter(s => s.isPinned);
  const groupedShortcuts = groups.reduce((acc, group) => {
    acc[group.id] = shortcuts.filter(s => s.group === group.id && !s.isPinned);
    return acc;
  }, {} as Record<string, Shortcut[]>);

  return (
    <div className={`${className || ''} sidebar-widget-content`}>
      <div className="sidebar-widget-header">
        <h3 className="sidebar-widget-title">Website Shortcuts</h3>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="sidebar-button"
              style={{
                backgroundColor: 'var(--theme-surface)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-accent)'
              }}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent 
            className="max-w-md"
            style={{
              backgroundColor: 'var(--theme-surface)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text)'
            }}
          >
            <DialogHeader>
              <DialogTitle style={{ color: 'var(--theme-text)' }}>
                {editingShortcut ? 'Edit Shortcut' : 'Add Website Shortcut'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" style={{ color: 'var(--theme-text)' }}>Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter shortcut name"
                  style={{
                    backgroundColor: 'var(--theme-background)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)'
                  }}
                />
              </div>
              <div>
                <Label htmlFor="url" style={{ color: 'var(--theme-text)' }}>URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                  style={{
                    backgroundColor: 'var(--theme-background)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)'
                  }}
                />
              </div>
              <div>
                <Label style={{ color: 'var(--theme-text)' }}>Icon</Label>
                <div className="grid grid-cols-10 gap-1 mt-2">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                      className={`p-2 rounded border-2 transition-all ${
                        formData.icon === icon ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
                      }`}
                      style={{
                        backgroundColor: formData.icon === icon ? 'var(--theme-accent)' : 'var(--theme-background)',
                      }}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label style={{ color: 'var(--theme-text)' }}>Color</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
                  <SelectTrigger style={{
                    backgroundColor: 'var(--theme-background)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)'
                  }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{
                    backgroundColor: 'var(--theme-surface)',
                    borderColor: 'var(--theme-border)',
                  }}>
                    {colorOptions.map(color => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${color.value}`} />
                          <span style={{ color: 'var(--theme-text)' }}>{color.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label style={{ color: 'var(--theme-text)' }}>Group</Label>
                <Select value={formData.group} onValueChange={(value) => setFormData(prev => ({ ...prev, group: value }))}>
                  <SelectTrigger style={{
                    backgroundColor: 'var(--theme-background)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)'
                  }}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={{
                    backgroundColor: 'var(--theme-surface)',
                    borderColor: 'var(--theme-border)',
                  }}>
                    {groups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${group.color}`} />
                          <span style={{ color: 'var(--theme-text)' }}>{group.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={editingShortcut ? handleEditShortcut : handleAddShortcut}
                  className="flex-1"
                  style={{
                    backgroundColor: 'var(--theme-accent)',
                    color: 'white'
                  }}
                >
                  {editingShortcut ? 'Update' : 'Add'} Shortcut
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingShortcut(null);
                    resetForm();
                  }}
                  style={{
                    backgroundColor: 'var(--theme-surface)',
                    borderColor: 'var(--theme-border)',
                    color: 'var(--theme-text)'
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="sidebar-widget-content space-y-4">
        {/* Pinned Shortcuts */}
        {pinnedShortcuts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4" style={{ color: 'var(--theme-accent)' }} />
              <h4 className="sidebar-text font-medium">Pinned</h4>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {pinnedShortcuts.map(shortcut => (
                <div key={shortcut.id} className="relative group">
                  <button
                    draggable
                    onDragStart={(e) => handleDragStart(e, shortcut)}
                    onClick={() => openShortcut(shortcut.url)}
                    className={`w-full aspect-square rounded-lg flex flex-col items-center justify-center p-2 transition-all duration-200 hover:scale-105 ${shortcut.color}`}
                    style={{
                      backgroundColor: `rgba(25, 25, 25, 0.7)`,
                      border: '1px solid var(--theme-border)',
                      backdropFilter: 'blur(8px)',
                    }}
                    title={`${shortcut.name} - ${shortcut.url}`}
                  >
                    <span className="text-lg mb-1">{shortcut.icon}</span>
                    <span className="text-xs text-white truncate w-full text-center">
                      {shortcut.name}
                    </span>
                  </button>
                  <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePin(shortcut.id);
                      }}
                      className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-xs hover:bg-yellow-600"
                    >
                      <Star className="w-3 h-3 fill-current" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(shortcut);
                        setIsAddModalOpen(true);
                      }}
                      className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs hover:bg-blue-600"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteShortcut(shortcut.id);
                      }}
                      className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Grouped Shortcuts */}
        {groups.map(group => {
          const groupShortcuts = groupedShortcuts[group.id] || [];
          if (groupShortcuts.length === 0) return null;

          const isExpanded = expandedGroups.has(group.id);

          return (
            <div key={group.id}>
              <button
                onClick={() => toggleGroupExpansion(group.id)}
                className="flex items-center gap-2 mb-2 w-full hover:opacity-80 transition-opacity"
              >
                <div className={`w-3 h-3 rounded-full ${group.color}`} />
                <h4 className="sidebar-text font-medium flex-1 text-left">{group.name}</h4>
                <Folder className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} style={{ color: 'var(--theme-text-secondary)' }} />
              </button>
              
              {isExpanded && (
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {groupShortcuts.map(shortcut => (
                    <div key={shortcut.id} className="relative group">
                      <button
                        draggable
                        onDragStart={(e) => handleDragStart(e, shortcut)}
                        onClick={() => openShortcut(shortcut.url)}
                        className={`w-full aspect-square rounded-lg flex flex-col items-center justify-center p-2 transition-all duration-200 hover:scale-105`}
                        style={{
                          backgroundColor: `rgba(25, 25, 25, 0.7)`,
                          border: '1px solid var(--theme-border)',
                          backdropFilter: 'blur(8px)',
                        }}
                        title={`${shortcut.name} - ${shortcut.url}`}
                      >
                        <span className="text-lg mb-1">{shortcut.icon}</span>
                        <span className="text-xs text-white truncate w-full text-center">
                          {shortcut.name}
                        </span>
                      </button>
                      <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePin(shortcut.id);
                          }}
                          className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-xs hover:bg-yellow-600"
                        >
                          <Star className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(shortcut);
                            setIsAddModalOpen(true);
                          }}
                          className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs hover:bg-blue-600"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteShortcut(shortcut.id);
                          }}
                          className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {shortcuts.length === 0 && (
          <div className="text-center py-8">
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" style={{ color: 'var(--theme-text-secondary)' }} />
            <p className="sidebar-text-secondary">No shortcuts yet.</p>
            <p className="sidebar-text-secondary text-sm">Add your first website shortcut!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WebsiteShortcutsWidget;
