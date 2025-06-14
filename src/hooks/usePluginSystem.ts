
import { useState, useEffect, useCallback } from 'react';
import { pluginManager, PluginInstance } from '@/plugins/PluginManager';

export const usePluginSystem = () => {
  const [plugins, setPlugins] = useState<PluginInstance[]>([]);
  const [isPluginStoreOpen, setIsPluginStoreOpen] = useState(false);

  useEffect(() => {
    loadPlugins();
    
    // Listen for plugin events
    const handlePluginEvents = (event: CustomEvent) => {
      console.log('Plugin event:', event.type, event.detail);
      loadPlugins();
    };

    window.addEventListener('plugin:register-widget', handlePluginEvents as EventListener);
    window.addEventListener('plugin:add-command', handlePluginEvents as EventListener);
    window.addEventListener('plugin:set-theme', handlePluginEvents as EventListener);

    return () => {
      window.removeEventListener('plugin:register-widget', handlePluginEvents as EventListener);
      window.removeEventListener('plugin:add-command', handlePluginEvents as EventListener);
      window.removeEventListener('plugin:set-theme', handlePluginEvents as EventListener);
    };
  }, []);

  const loadPlugins = useCallback(() => {
    const installedPlugins = pluginManager.getInstalledPlugins();
    setPlugins(installedPlugins);
  }, []);

  const openPluginStore = useCallback(() => {
    setIsPluginStoreOpen(true);
  }, []);

  const closePluginStore = useCallback(() => {
    setIsPluginStoreOpen(false);
  }, []);

  const emitActivity = useCallback((activityData: any) => {
    pluginManager.emitActivity(activityData);
  }, []);

  const loadPlugin = useCallback(async (pluginPath: string) => {
    const success = await pluginManager.loadPlugin(pluginPath);
    if (success) {
      loadPlugins();
    }
    return success;
  }, [loadPlugins]);

  const unloadPlugin = useCallback((pluginId: string) => {
    const success = pluginManager.unloadPlugin(pluginId);
    if (success) {
      loadPlugins();
    }
    return success;
  }, [loadPlugins]);

  const togglePlugin = useCallback((pluginId: string) => {
    const enabled = pluginManager.togglePlugin(pluginId);
    loadPlugins();
    return enabled;
  }, [loadPlugins]);

  return {
    plugins,
    isPluginStoreOpen,
    openPluginStore,
    closePluginStore,
    loadPlugin,
    unloadPlugin,
    togglePlugin,
    emitActivity,
    loadPlugins
  };
};
