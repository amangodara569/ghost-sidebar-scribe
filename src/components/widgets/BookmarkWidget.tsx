
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Folder, FolderOpen, ExternalLink, Eye, Edit, Trash2, ChevronRight, ChevronDown } from 'lucide-react';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  folderId?: string;
  favicon?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

interface BookmarkFolder {
  id: string;
  name: string;
  parentId?: string;
  expanded: boolean;
  createdAt: string;
}

interface BookmarkWidgetProps {
  widgetId: string;
}

const BookmarkWidget: React.FC<BookmarkWidgetProps> = ({ widgetId }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [folders, setFolders] = useState<BookmarkFolder[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadBookmarks();
    loadFolders();
  }, []);

  const loadBookmarks = async () => {
    try {
      if (window.electronAPI) {
        const storedBookmarks = await window.electronAPI.invoke('bookmarks:getAll');
        setBookmarks(storedBookmarks || []);
      }
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  };

  const loadFolders = async () => {
    try {
      if (window.electronAPI) {
        const storedFolders = await window.electronAPI.invoke('bookmarks:getFolders');
        setFolders(storedFolders || []);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const addBookmark = async () => {
    try {
      if (window.electronAPI) {
        // Get current active window URL and title
        const activeWindow = await window.electronAPI.invoke('browser:getActiveWindow');
        
        const newBookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'> = {
          title: activeWindow?.title || 'New Bookmark',
          url: activeWindow?.url || 'https://example.com',
          folderId: undefined,
        };

        const savedBookmark = await window.electronAPI.invoke('bookmarks:add', newBookmark);
        setBookmarks(prev => [savedBookmark, ...prev]);
      }
    } catch (error) {
      console.error('Failed to add bookmark:', error);
      // Fallback: create a manual bookmark
      const newBookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'> = {
        title: 'New Bookmark',
        url: 'https://example.com',
      };
      
      if (window.electronAPI) {
        const savedBookmark = await window.electronAPI.invoke('bookmarks:add', newBookmark);
        setBookmarks(prev => [savedBookmark, ...prev]);
      }
    }
  };

  const updateBookmark = async (id: string, updates: Partial<Bookmark>) => {
    try {
      if (window.electronAPI) {
        const updatedBookmark = await window.electronAPI.invoke('bookmarks:update', id, updates);
        setBookmarks(prev => prev.map(b => b.id === id ? updatedBookmark : b));
      }
    } catch (error) {
      console.error('Failed to update bookmark:', error);
    }
  };

  const deleteBookmark = async (id: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('bookmarks:delete', id);
        setBookmarks(prev => prev.filter(b => b.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete bookmark:', error);
    }
  };

  const toggleFolder = async (folderId: string) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      const updatedFolder = { ...folder, expanded: !folder.expanded };
      setFolders(prev => prev.map(f => f.id === folderId ? updatedFolder : f));
      
      if (window.electronAPI) {
        await window.electronAPI.invoke('bookmarks:updateFolder', folderId, { expanded: !folder.expanded });
      }
    }
  };

  const openInBrowser = async (url: string) => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('browser:openExternal', url);
      }
    } catch (error) {
      console.error('Failed to open in browser:', error);
    }
  };

  const showMiniPreview = (url: string) => {
    setPreviewUrl(url);
    setShowPreview(true);
  };

  const startEditing = (bookmark: Bookmark) => {
    setEditingId(bookmark.id);
    setEditingTitle(bookmark.title);
  };

  const saveEdit = async () => {
    if (editingId && editingTitle.trim()) {
      await updateBookmark(editingId, { title: editingTitle.trim() });
      setEditingId(null);
      setEditingTitle('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const getFolderBookmarks = (folderId?: string) => {
    return bookmarks.filter(b => b.folderId === folderId);
  };

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
    } catch {
      return null;
    }
  };

  return (
    <Card className="bg-transparent border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-100">Bookmarks</CardTitle>
          <Button
            onClick={addBookmark}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="max-h-80 overflow-y-auto space-y-1">
          {/* Bookmarks without folders */}
          {getFolderBookmarks().map((bookmark) => (
            <div
              key={bookmark.id}
              className="flex items-center gap-2 p-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors"
            >
              {getFavicon(bookmark.url) && (
                <img
                  src={getFavicon(bookmark.url)!}
                  alt=""
                  className="w-4 h-4"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              
              {editingId === bookmark.id ? (
                <div className="flex-1 flex gap-2 items-center">
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                    className="flex-1 bg-gray-700 border-gray-600 text-gray-100 px-2 py-1 rounded border focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                    autoFocus
                  />
                  <Button onClick={saveEdit} size="sm" variant="ghost" className="p-1 h-auto">
                    <Edit className="w-3 h-3 text-green-500" />
                  </Button>
                  <Button onClick={cancelEdit} size="sm" variant="ghost" className="p-1 h-auto">
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200 truncate">{bookmark.title}</div>
                    <div className="text-xs text-gray-400 truncate">{bookmark.url}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => showMiniPreview(bookmark.url)}
                      size="sm"
                      variant="ghost"
                      className="p-1 h-auto text-blue-400 hover:text-blue-300"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => openInBrowser(bookmark.url)}
                      size="sm"
                      variant="ghost"
                      className="p-1 h-auto text-green-400 hover:text-green-300"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => startEditing(bookmark)}
                      size="sm"
                      variant="ghost"
                      className="p-1 h-auto text-gray-400 hover:text-gray-300"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => deleteBookmark(bookmark.id)}
                      size="sm"
                      variant="ghost"
                      className="p-1 h-auto text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {/* Folders */}
          {folders.map((folder) => (
            <div key={folder.id} className="space-y-1">
              <div
                className="flex items-center gap-2 p-2 rounded bg-gray-800/50 border border-gray-600 hover:bg-gray-700/50 transition-colors cursor-pointer"
                onClick={() => toggleFolder(folder.id)}
              >
                {folder.expanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
                {folder.expanded ? (
                  <FolderOpen className="w-4 h-4 text-yellow-500" />
                ) : (
                  <Folder className="w-4 h-4 text-yellow-500" />
                )}
                <span className="text-sm text-gray-200">{folder.name}</span>
                <span className="text-xs text-gray-400">
                  ({getFolderBookmarks(folder.id).length})
                </span>
              </div>
              
              {folder.expanded && (
                <div className="ml-6 space-y-1">
                  {getFolderBookmarks(folder.id).map((bookmark) => (
                    <div
                      key={bookmark.id}
                      className="flex items-center gap-2 p-2 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 transition-colors"
                    >
                      {/* Same bookmark content as above */}
                      {getFavicon(bookmark.url) && (
                        <img
                          src={getFavicon(bookmark.url)!}
                          alt=""
                          className="w-4 h-4"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-200 truncate">{bookmark.title}</div>
                        <div className="text-xs text-gray-400 truncate">{bookmark.url}</div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => showMiniPreview(bookmark.url)}
                          size="sm"
                          variant="ghost"
                          className="p-1 h-auto text-blue-400 hover:text-blue-300"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => openInBrowser(bookmark.url)}
                          size="sm"
                          variant="ghost"
                          className="p-1 h-auto text-green-400 hover:text-green-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => deleteBookmark(bookmark.id)}
                          size="sm"
                          variant="ghost"
                          className="p-1 h-auto text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {bookmarks.length === 0 && (
            <div className="text-center py-6 text-gray-400">
              <p>No bookmarks yet. Add your first bookmark!</p>
            </div>
          )}
        </div>

        {/* Mini Preview Modal */}
        {showPreview && previewUrl && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-4 max-w-4xl max-h-[80vh] w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-100">Preview</h3>
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-gray-200"
                >
                  ×
                </Button>
              </div>
              <div className="bg-white rounded overflow-hidden">
                <webview
                  src={previewUrl}
                  style={{ width: '100%', height: '400px' }}
                  className="w-full h-96"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookmarkWidget;
