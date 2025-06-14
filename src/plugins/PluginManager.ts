
import { toast } from 'sonner';

export interface PluginConfig {
  name: string;
  id: string;
  author: string;
  version: string;
  type: 'widget' | 'integration' | 'command' | 'event-hook';
  slot?: string;
  description: string;
  settings?: Record<string, any>;
  dependencies?: string[];
  permissions?: string[];
}

export interface PluginInstance {
  config: PluginConfig;
  module: any;
  enabled: boolean;
  loadedAt: string;
}

export interface VibeAPI {
  registerWidget: (widgetConfig: any) => void;
  addCommand: (command: any) => void;
  listenToActivity: (callback: (event: any) => void) => void;
  getData: (type: 'notes' | 'todos' | 'timers' | 'spotify') => any;
  setTheme: (theme: string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  storage: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
  };
}

class PluginManager {
  private plugins: Map<string, PluginInstance> = new Map();
  private eventListeners: Map<string, Function[]> = new Map();
  private vibeAPI: VibeAPI;

  constructor() {
    this.vibeAPI = this.createVibeAPI();
  }

  private createVibeAPI(): VibeAPI {
    return {
      registerWidget: (widgetConfig) => {
        window.dispatchEvent(new CustomEvent('plugin:register-widget', { detail: widgetConfig }));
      },
      addCommand: (command) => {
        window.dispatchEvent(new CustomEvent('plugin:add-command', { detail: command }));
      },
      listenToActivity: (callback) => {
        const listeners = this.eventListeners.get('activity') || [];
        listeners.push(callback);
        this.eventListeners.set('activity', listeners);
      },
      getData: (type) => {
        const data = localStorage.getItem(`vibemind-${type}`);
        return data ? JSON.parse(data) : null;
      },
      setTheme: (theme) => {
        window.dispatchEvent(new CustomEvent('plugin:set-theme', { detail: theme }));
      },
      showToast: (message, type = 'info') => {
        if (type === 'success') toast.success(message);
        else if (type === 'error') toast.error(message);
        else toast.info(message);
      },
      storage: {
        get: (key) => {
          const data = localStorage.getItem(`plugin-storage-${key}`);
          return data ? JSON.parse(data) : null;
        },
        set: (key, value) => {
          localStorage.setItem(`plugin-storage-${key}`, JSON.stringify(value));
        }
      }
    };
  }

  async loadPlugin(pluginPath: string): Promise<boolean> {
    try {
      console.log(`Loading plugin from: ${pluginPath}`);
      
      // In a real implementation, this would dynamically import from the plugins folder
      // For now, we'll simulate plugin loading
      const pluginModule = await this.simulatePluginImport(pluginPath);
      
      if (!pluginModule || !pluginModule.config) {
        throw new Error('Invalid plugin: missing config');
      }

      const config = pluginModule.config as PluginConfig;
      
      // Validate plugin config
      if (!this.validatePluginConfig(config)) {
        throw new Error('Invalid plugin configuration');
      }

      // Check if plugin is already loaded
      if (this.plugins.has(config.id)) {
        throw new Error('Plugin already loaded');
      }

      const pluginInstance: PluginInstance = {
        config,
        module: pluginModule,
        enabled: true,
        loadedAt: new Date().toISOString()
      };

      // Initialize plugin
      if (pluginModule.init && typeof pluginModule.init === 'function') {
        await pluginModule.init(this.vibeAPI);
      }

      this.plugins.set(config.id, pluginInstance);
      
      toast.success(`Plugin "${config.name}" loaded successfully`);
      console.log(`Plugin "${config.name}" loaded successfully`);
      
      return true;
    } catch (error) {
      console.error('Failed to load plugin:', error);
      toast.error(`Failed to load plugin: ${error.message}`);
      return false;
    }
  }

  private async simulatePluginImport(pluginPath: string) {
    // Simulate different plugin types for demo
    const plugins = {
      'pomodoro-plus': {
        config: {
          name: 'Pomodoro Plus',
          id: 'pomodoro-plus',
          author: 'VibeMind Team',
          version: '1.0.0',
          type: 'widget',
          slot: 'timer',
          description: 'Enhanced Pomodoro timer with advanced features',
          settings: { defaultDuration: 25, longBreak: 15 }
        },
        init: async (api: VibeAPI) => {
          api.showToast('Pomodoro Plus initialized!', 'success');
        }
      },
      'tab-saver': {
        config: {
          name: 'Tab Saver',
          id: 'tab-saver',
          author: 'Productivity Labs',
          version: '1.0.0',
          type: 'integration',
          description: 'Save and organize browser tabs',
          settings: { autoSave: true, maxTabs: 50 }
        },
        init: async (api: VibeAPI) => {
          api.addCommand({
            id: 'save-tabs',
            label: 'Save Current Tabs',
            action: () => api.showToast('Tabs saved!', 'success')
          });
        }
      },
      'focus-tracker': {
        config: {
          name: 'Focus Tracker',
          id: 'focus-tracker',
          author: 'Analytics Pro',
          version: '1.0.0',
          type: 'event-hook',
          description: 'Track focus patterns and productivity',
          settings: { trackingInterval: 300 }
        },
        init: async (api: VibeAPI) => {
          api.listenToActivity((event) => {
            console.log('Focus activity detected:', event);
          });
        }
      }
    };

    const pluginId = pluginPath.replace('./plugins/', '').replace('.js', '');
    return plugins[pluginId] || null;
  }

  private validatePluginConfig(config: PluginConfig): boolean {
    const required = ['name', 'id', 'author', 'version', 'type', 'description'];
    return required.every(field => config[field] && typeof config[field] === 'string');
  }

  unloadPlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      toast.error('Plugin not found');
      return false;
    }

    try {
      // Call cleanup if available
      if (plugin.module.cleanup && typeof plugin.module.cleanup === 'function') {
        plugin.module.cleanup();
      }

      this.plugins.delete(pluginId);
      toast.success(`Plugin "${plugin.config.name}" unloaded`);
      return true;
    } catch (error) {
      console.error('Failed to unload plugin:', error);
      toast.error('Failed to unload plugin');
      return false;
    }
  }

  togglePlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;

    plugin.enabled = !plugin.enabled;
    
    if (plugin.enabled && plugin.module.enable) {
      plugin.module.enable();
    } else if (!plugin.enabled && plugin.module.disable) {
      plugin.module.disable();
    }

    return plugin.enabled;
  }

  getInstalledPlugins(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  getPluginById(id: string): PluginInstance | undefined {
    return this.plugins.get(id);
  }

  async loadDefaultPlugins() {
    const defaultPlugins = ['pomodoro-plus', 'tab-saver', 'focus-tracker'];
    
    for (const pluginId of defaultPlugins) {
      await this.loadPlugin(`./plugins/${pluginId}.js`);
    }
  }

  emitActivity(event: any) {
    const listeners = this.eventListeners.get('activity') || [];
    listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Plugin activity listener error:', error);
      }
    });
  }
}

export const pluginManager = new PluginManager();
