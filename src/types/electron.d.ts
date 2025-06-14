export interface IElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  on: (channel: string, listener: (...args: any[]) => void) => void;
  removeListener: (channel: string, listener: (...args: any[]) => void) => void;
  
  'timer:start': (options: { duration: number; type: 'work' | 'break'; mode: string }) => Promise<void>;
  'timer:pause': () => Promise<void>;
  'timer:reset': () => Promise<void>;
  'timer:getState': () => Promise<{
    timeLeft: number;
    isRunning: boolean;
    currentSession: 'work' | 'break';
    sessionsCompleted: number;
  }>;
  
  'bookmarks:getAll': () => Promise<any[]>;
  'bookmarks:getFolders': () => Promise<any[]>;
  'bookmarks:add': (bookmark: any) => Promise<any>;
  'bookmarks:update': (id: string, updates: any) => Promise<any>;
  'bookmarks:delete': (id: string) => Promise<void>;
  'bookmarks:updateFolder': (id: string, updates: any) => Promise<any>;
  
  'browser:getActiveWindow': () => Promise<{ title: string; url: string } | null>;
  'browser:openExternal': (url: string) => Promise<void>;
  
  'widgets:getAll': () => Promise<any[]>;
  'widgets:updateOrder': (widgets: any[]) => Promise<void>;
  
  'notes:getAll': () => Promise<any[]>;
  'notes:save': (note: any) => Promise<any>;
  
  'todos:getAll': () => Promise<any[]>;
  'todos:save': (todo: any) => Promise<any>;
  'todos:delete': (id: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}

export interface Widget {
  id: string;
  type: 'notes' | 'todo' | 'timer' | 'weather' | 'music';
  order: number;
  enabled: boolean;
  settings?: Record<string, any>;
}

export interface Note {
  id: string;
  title: string;
  content: any[];
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}
