
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plugin, Download, Trash2, RefreshCw, Settings } from 'lucide-react';
import { pluginManager, PluginInstance } from '@/plugins/PluginManager';
import { toast } from 'sonner';

interface PluginStoreProps {
  isOpen: boolean;
  onClose: () => void;
}

const PluginStore: React.FC<PluginStoreProps> = ({ isOpen, onClose }) => {
  const [plugins, setPlugins] = useState<PluginInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPlugins();
    }
  }, [isOpen]);

  const loadPlugins = () => {
    const installedPlugins = pluginManager.getInstalledPlugins();
    setPlugins(installedPlugins);
  };

  const handleTogglePlugin = (pluginId: string) => {
    const enabled = pluginManager.togglePlugin(pluginId);
    loadPlugins();
    toast.success(`Plugin ${enabled ? 'enabled' : 'disabled'}`);
  };

  const handleUnloadPlugin = (pluginId: string) => {
    if (pluginManager.unloadPlugin(pluginId)) {
      loadPlugins();
    }
  };

  const handleLoadDemoPlugins = async () => {
    setIsLoading(true);
    await pluginManager.loadDefaultPlugins();
    loadPlugins();
    setIsLoading(false);
  };

  const handleReloadPlugins = () => {
    loadPlugins();
    toast.success('Plugin list refreshed');
  };

  const getPluginTypeColor = (type: string) => {
    switch (type) {
      case 'widget': return 'bg-blue-500';
      case 'integration': return 'bg-green-500';
      case 'command': return 'bg-purple-500';
      case 'event-hook': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plugin className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Plugin Store</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReloadPlugins}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadDemoPlugins}
                disabled={isLoading}
              >
                <Download className="w-4 h-4 mr-2" />
                {isLoading ? 'Loading...' : 'Load Demo Plugins'}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {plugins.length === 0 ? (
            <div className="text-center py-12">
              <Plugin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Plugins Installed</h3>
              <p className="text-muted-foreground mb-4">
                Load some demo plugins to get started with the plugin system.
              </p>
              <Button onClick={handleLoadDemoPlugins} disabled={isLoading}>
                <Download className="w-4 h-4 mr-2" />
                {isLoading ? 'Loading...' : 'Load Demo Plugins'}
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {plugins.map((plugin) => (
                <Card key={plugin.config.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{plugin.config.name}</CardTitle>
                          <Badge 
                            variant="secondary" 
                            className={`text-white ${getPluginTypeColor(plugin.config.type)}`}
                          >
                            {plugin.config.type}
                          </Badge>
                          {plugin.enabled && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{plugin.config.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>by {plugin.config.author}</span>
                          <span>v{plugin.config.version}</span>
                          <span>Loaded {new Date(plugin.loadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={plugin.enabled}
                          onCheckedChange={() => handleTogglePlugin(plugin.config.id)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUnloadPlugin(plugin.config.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {plugin.config.settings && (
                    <CardContent className="pt-0">
                      <Separator className="mb-3" />
                      <div className="text-sm">
                        <h4 className="font-medium mb-2 flex items-center gap-1">
                          <Settings className="w-4 h-4" />
                          Plugin Settings
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          {Object.entries(plugin.config.settings).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PluginStore;
