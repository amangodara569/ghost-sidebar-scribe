
export interface ElectronAPI {
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeAllListeners: (channel: string) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
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
