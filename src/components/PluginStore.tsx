
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plug, Download, Settings, Trash2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePluginSystem } from '@/hooks/usePluginSystem';
import { toast } from 'sonner';

interface Plugin {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  enabled: boolean;
}

const PluginStore: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { plugins, loadPlugin, unloadPlugin, togglePlugin } = usePluginSystem();

  const handleInstall = async (pluginPath: string) => {
    const success = await loadPlugin(pluginPath);
    if (success) {
      toast.success('Plugin installed successfully!');
    } else {
      toast.error('Failed to install plugin.');
    }
  };

  const handleUninstall = async (pluginId: string) => {
    const success = await unloadPlugin(pluginId);
    if (success) {
      toast.success('Plugin uninstalled successfully!');
    } else {
      toast.error('Failed to uninstall plugin.');
    }
  };

  const handleToggle = (pluginId: string) => {
    const enabled = togglePlugin(pluginId);
    toast.success(`Plugin ${enabled ? 'enabled' : 'disabled'}!`);
  };

  const filteredPlugins = plugins.filter(plugin =>
    plugin.config?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plugin.config?.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const availablePlugins: Plugin[] = [
    {
      id: 'example-plugin',
      name: 'Example Plugin',
      description: 'A sample plugin to demonstrate the plugin system.',
      author: 'Lovable',
      version: '1.0.0',
      enabled: false,
    },
    {
      id: 'another-plugin',
      name: 'Another Plugin',
      description: 'Another sample plugin to showcase different functionalities.',
      author: 'Lovable',
      version: '0.5.0',
      enabled: false,
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Plugin Store</DialogTitle>
        </DialogHeader>

        <div className="mb-4 flex items-center space-x-2">
          <Search className="w-4 h-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search plugins..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800 border-gray-700 text-gray-100 focus:ring-blue-500"
          />
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {filteredPlugins.map((plugin) => (
            <Card key={plugin.config?.id || plugin.id} className="bg-gray-900 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium text-gray-100">
                    {plugin.config?.name || 'Unknown Plugin'}
                  </CardTitle>
                  <Badge variant="secondary">{plugin.config?.version || '1.0.0'}</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-gray-400 space-y-1">
                <p>{plugin.config?.description || 'No description available'}</p>
                <p>Author: {plugin.config?.author || 'Unknown'}</p>
                <div className="flex items-center justify-between">
                  <label htmlFor={`plugin-toggle-${plugin.config?.id || plugin.id}`} className="text-gray-200">
                    {plugin.enabled ? 'Enabled' : 'Disabled'}
                  </label>
                  <Switch
                    id={`plugin-toggle-${plugin.config?.id || plugin.id}`}
                    checked={plugin.enabled}
                    onCheckedChange={() => handleToggle(plugin.config?.id || plugin.id)}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                    onClick={() => handleUninstall(plugin.config?.id || plugin.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Uninstall
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {availablePlugins
            .filter(plugin => !plugins.find(p => p.config?.id === plugin.id))
            .map((plugin) => (
              <Card key={plugin.id} className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium text-gray-100">{plugin.name}</CardTitle>
                    <Badge variant="secondary">{plugin.version}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-gray-400 space-y-1">
                  <p>{plugin.description}</p>
                  <p>Author: {plugin.author}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-gray-100"
                    onClick={() => handleInstall(plugin.id)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Install
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>

        <Button variant="secondary" onClick={onClose} className="mt-4">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PluginStore;
