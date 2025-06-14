export interface ElectronAPI {
  // Core IPC methods
  invoke(channel: string, ...args: any[]): Promise<any>;
  on(channel: string, func: (...args: any[]) => void): void;
  removeListener(channel: string, func: (...args: any[]) => void): void;
  removeAllListeners(channel: string): void;
  
  // Specific method signatures for type safety
  invoke(channel: 'widgets:getAll'): Promise<any[]>;
  invoke(channel: 'widgets:updateOrder', widgets: any[]): Promise<void>;
  invoke(channel: 'theme:get'): Promise<any>;
  invoke(channel: 'theme:save', theme: any): Promise<void>;
  invoke(channel: 'notifications:show', notification: any): Promise<void>;
  invoke(channel: 'notifications:getHistory'): Promise<any[]>;
  invoke(channel: 'notifications:save', notifications: any[]): Promise<void>;
  
  // Workspace methods
  invoke(channel: 'workspace:getAll'): Promise<any[]>;
  invoke(channel: 'workspace:save', workspace: any): Promise<void>;
  invoke(channel: 'workspace:delete', workspaceId: string): Promise<void>;
  invoke(channel: 'workspace:switch', workspaceId: string): Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
