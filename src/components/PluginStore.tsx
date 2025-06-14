import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Trash2, Settings, Plug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface PluginConfig {
  name: string;
  author: string;
  description: string;
  version: string;
  type: 'widget' | 'theme' | 'tool';
  entryPoint?: string;
}

interface PluginInstance {
  config: PluginConfig;
  enabled: boolean;
}

const examplePlugins: PluginInstance[] = [
  {
    config: {
      name: 'Pomodoro Timer',
      author: 'Vibe Studio',
      description: 'A simple pomodoro timer widget',
      version: '1.0.0',
      type: 'widget',
    },
    enabled: true,
  },
  {
    config: {
      name: 'Dark Theme',
      author: 'Vibe Studio',
      description: 'A sleek dark theme for the sidebar',
      version: '1.0.0',
      type: 'theme',
    },
    enabled: false,
  },
  {
    config: {
      name: 'Note Exporter',
      author: 'Vibe Studio',
      description: 'Export your notes to various formats',
      version: '1.0.0',
      type: 'tool',
    },
    enabled: false,
  },
];

interface PluginStoreProps {
  isOpen: boolean;
  onClose: () => void;
}

const PluginStore: React.FC<PluginStoreProps> = ({ isOpen, onClose }) => {
  const [installedPlugins, setInstalledPlugins] = useState<PluginInstance[]>([]);
  const [availablePlugins] = useState<PluginInstance[]>(examplePlugins);

  const installPlugin = (plugin: PluginInstance) => {
    setInstalledPlugins(prev => [...prev, { ...plugin, enabled: true }]);
  };

  const uninstallPlugin = (pluginName: string) => {
    setInstalledPlugins(prev => prev.filter(p => p.config.name !== pluginName));
  };

  const togglePlugin = (pluginName: string) => {
    setInstalledPlugins(prev => 
      prev.map(p => 
        p.config.name === pluginName ? { ...p, enabled: !p.enabled } : p
      )
    );
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-4xl h-[80vh] rounded-lg border shadow-2xl overflow-hidden"
        style={{
          backgroundColor: 'var(--theme-surface)',
          borderColor: 'var(--theme-border)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--theme-border)' }}>
          <div className="flex items-center gap-3">
            <Plug className="w-6 h-6" style={{ color: 'var(--theme-accent)' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--theme-text)' }}>
              Plugin Store
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex h-full">
          {/* Installed Plugins */}
          <div className="w-1/2 p-6 border-r" style={{ borderColor: 'var(--theme-border)' }}>
            <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--theme-text)' }}>
              Installed Plugins
            </h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {installedPlugins.map((plugin) => (
                <div
                  key={plugin.config.name}
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--theme-background)',
                    borderColor: 'var(--theme-border)'
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium" style={{ color: 'var(--theme-text)' }}>
                        {plugin.config.name}
                      </h4>
                      <p className="text-sm opacity-70" style={{ color: 'var(--theme-text)' }}>
                        by {plugin.config.author}
                      </p>
                    </div>
                    <Switch
                      checked={plugin.enabled}
                      onCheckedChange={() => togglePlugin(plugin.config.name)}
                    />
                  </div>
                  <p className="text-sm mb-3 opacity-80" style={{ color: 'var(--theme-text)' }}>
                    {plugin.config.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{plugin.config.type}</Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => uninstallPlugin(plugin.config.name)}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              {installedPlugins.length === 0 && (
                <div className="text-center py-8 opacity-50" style={{ color: 'var(--theme-text)' }}>
                  No plugins installed yet
                </div>
              )}
            </div>
          </div>

          {/* Available Plugins */}
          <div className="w-1/2 p-6">
            <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--theme-text)' }}>
              Available Plugins
            </h3>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {availablePlugins
                .filter(plugin => !installedPlugins.some(installed => installed.config.name === plugin.config.name))
                .map((plugin) => (
                  <div
                    key={plugin.config.name}
                    className="p-4 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--theme-background)',
                      borderColor: 'var(--theme-border)'
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium" style={{ color: 'var(--theme-text)' }}>
                          {plugin.config.name}
                        </h4>
                        <p className="text-sm opacity-70" style={{ color: 'var(--theme-text)' }}>
                          by {plugin.config.author}
                        </p>
                      </div>
                      <Badge variant="outline">{plugin.config.type}</Badge>
                    </div>
                    <p className="text-sm mb-3 opacity-80" style={{ color: 'var(--theme-text)' }}>
                      {plugin.config.description}
                    </p>
                    <Button
                      onClick={() => installPlugin(plugin)}
                      size="sm"
                      className="w-full"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Install
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PluginStore;
