import { FreeSpace } from "@/components/widgets/FreeSpaceWidget";

interface ElectronAPI {
  setTitle: (title: string) => Promise<void>
  openFile: () => Promise<string>
  saveFile: (filename: string, content: string) => Promise<void>
  sendMessage: (message: string) => void
  receiveMessage: (callback: (message: string) => void) => void
  removeAllListeners: () => void
  'widgets:getAll': () => Promise<any[]>
  'widgets:updateOrder': (widgets: any[]) => Promise<void>
  'freespace:getAll': () => Promise<FreeSpace[]>
  'freespace:save': (space: FreeSpace) => Promise<void>
  'freespace:delete': (id: string) => Promise<void>
  // Theme API
  'theme:get': () => Promise<{
    presetId?: string;
    customTheme?: any;
    isCustom: boolean;
  } | null>;
  'theme:save': (themeData: {
    presetId?: string;
    customTheme?: any;
    isCustom: boolean;
  }) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
