
export interface IElectronAPI {
  // Widget management
  invoke: (channel: string, ...args: any[]) => Promise<any>;
  on: (channel: string, callback: (...args: any[]) => void) => void;
  removeListener: (channel: string, callback: (...args: any[]) => void) => void;
  
  // Notes
  'notes:getAll': () => Promise<any[]>;
  'notes:save': (note: any) => Promise<void>;
  'notes:delete': (id: string) => Promise<void>;
  
  // Todos
  'todos:getAll': () => Promise<any[]>;
  'todos:add': (todo: any) => Promise<void>;
  'todos:update': (id: string, updates: any) => Promise<void>;
  'todos:delete': (id: string) => Promise<void>;
  
  // Timer
  'timer:getState': () => Promise<any>;
  'timer:start': (config: any) => Promise<void>;
  'timer:pause': () => Promise<void>;
  'timer:reset': () => Promise<void>;
  
  // Bookmarks
  'bookmarks:getAll': () => Promise<any[]>;
  'bookmarks:add': (bookmark: any) => Promise<void>;
  'bookmarks:update': (id: string, updates: any) => Promise<void>;
  'bookmarks:delete': (id: string) => Promise<void>;
  'browser:getActiveURL': () => Promise<string>;
  'browser:openExternal': (url: string) => Promise<void>;
  
  // Spotify
  'spotify:checkConnection': () => Promise<boolean>;
  'spotify:connect': () => Promise<boolean>;
  'spotify:getCurrentTrack': () => Promise<any>;
  'spotify:play': () => Promise<void>;
  'spotify:pause': () => Promise<void>;
  'spotify:next': () => Promise<void>;
  'spotify:prev': () => Promise<void>;
  'spotify:setVolume': (volume: number) => Promise<void>;
  
  // Widgets
  'widgets:getAll': () => Promise<any[]>;
  'widgets:updateOrder': (widgets: any[]) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
