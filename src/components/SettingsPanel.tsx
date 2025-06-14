
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Settings, Palette, Timer, Volume2, Cloud, StickyNote, X } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';

interface SettingsData {
  appearance: {
    darkTheme: boolean;
    themePalette: 'dark-grey' | 'carbon-black' | 'ocean-blue' | 'neo-purple';
    sidebarOpacity: number;
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
  };
  behavior: {
    startOnBoot: boolean;
    enableHotkeys: boolean;
    dockingPreference: 'left' | 'right' | 'floating' | 'corner';
    smoothDragging: boolean;
  };
  focusTracker: {
    enableFeedback: boolean;
    nudgeFrequency: 'low' | 'medium' | 'high';
    idleTimeout: number;
  };
  timer: {
    defaultDuration: number;
    enableBreakTimer: boolean;
    playSoundOnComplete: boolean;
    desktopNotifications: boolean;
  };
  spotify: {
    isConnected: boolean;
    autoPlayFocusPlaylist: boolean;
    volume: number;
    showNowPlaying: boolean;
  };
  storage: {
    enableLocalSave: boolean;
    enableCloudSync: boolean;
  };
  stickyNotes: {
    fontSize: 'small' | 'medium' | 'large';
    backgroundColor: 'yellow' | 'grey' | 'dark';
    enablePopOut: boolean;
  };
}

const defaultSettings: SettingsData = {
  appearance: {
    darkTheme: true,
    themePalette: 'dark-grey',
    sidebarOpacity: 85,
    fontSize: 'medium',
    compactMode: false,
  },
  behavior: {
    startOnBoot: false,
    enableHotkeys: true,
    dockingPreference: 'floating',
    smoothDragging: true,
  },
  focusTracker: {
    enableFeedback: true,
    nudgeFrequency: 'medium',
    idleTimeout: 60,
  },
  timer: {
    defaultDuration: 25,
    enableBreakTimer: true,
    playSoundOnComplete: true,
    desktopNotifications: true,
  },
  spotify: {
    isConnected: false,
    autoPlayFocusPlaylist: false,
    volume: 50,
    showNowPlaying: true,
  },
  storage: {
    enableLocalSave: true,
    enableCloudSync: false,
  },
  stickyNotes: {
    fontSize: 'medium',
    backgroundColor: 'yellow',
    enablePopOut: false,
  },
};

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useLocalStorage<SettingsData>('vibemind-settings', defaultSettings);

  const updateSetting = (category: keyof SettingsData, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
    toast.success('Setting updated');
  };

  const resetAllSettings = () => {
    setSettings(defaultSettings);
    toast.success('All settings reset to default');
  };

  const exportData = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'vibemind-settings.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Settings exported');
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.clear();
      toast.success('All data cleared');
      window.location.reload();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-hidden"
        style={{
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Settings className="w-5 h-5" />
            Settings & Preferences
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 100px)' }}>
          <Accordion type="multiple" defaultValue={["appearance", "behavior"]} className="w-full">
            
            {/* Appearance Settings */}
            <AccordionItem value="appearance">
              <AccordionTrigger className="text-white hover:text-gray-300">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Appearance
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-theme" className="text-gray-300">Dark Theme</Label>
                  <Switch
                    id="dark-theme"
                    checked={settings.appearance.darkTheme}
                    onCheckedChange={(checked) => updateSetting('appearance', 'darkTheme', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Theme Palette</Label>
                  <Select
                    value={settings.appearance.themePalette}
                    onValueChange={(value) => updateSetting('appearance', 'themePalette', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark-grey">Dark Grey</SelectItem>
                      <SelectItem value="carbon-black">Carbon Black</SelectItem>
                      <SelectItem value="ocean-blue">Ocean Blue</SelectItem>
                      <SelectItem value="neo-purple">Neo Purple</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Sidebar Opacity: {settings.appearance.sidebarOpacity}%</Label>
                  <Slider
                    value={[settings.appearance.sidebarOpacity]}
                    onValueChange={([value]) => updateSetting('appearance', 'sidebarOpacity', value)}
                    min={10}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Font Size</Label>
                  <Select
                    value={settings.appearance.fontSize}
                    onValueChange={(value) => updateSetting('appearance', 'fontSize', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="compact-mode" className="text-gray-300">Compact Mode</Label>
                  <Switch
                    id="compact-mode"
                    checked={settings.appearance.compactMode}
                    onCheckedChange={(checked) => updateSetting('appearance', 'compactMode', checked)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Behavior Settings */}
            <AccordionItem value="behavior">
              <AccordionTrigger className="text-white hover:text-gray-300">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Behavior
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="start-boot" className="text-gray-300">Start on System Boot</Label>
                  <Switch
                    id="start-boot"
                    checked={settings.behavior.startOnBoot}
                    onCheckedChange={(checked) => updateSetting('behavior', 'startOnBoot', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="hotkeys" className="text-gray-300">Enable Hotkey Shortcuts</Label>
                  <Switch
                    id="hotkeys"
                    checked={settings.behavior.enableHotkeys}
                    onCheckedChange={(checked) => updateSetting('behavior', 'enableHotkeys', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Sidebar Docking</Label>
                  <Select
                    value={settings.behavior.dockingPreference}
                    onValueChange={(value) => updateSetting('behavior', 'dockingPreference', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left Edge</SelectItem>
                      <SelectItem value="right">Right Edge</SelectItem>
                      <SelectItem value="floating">Floating</SelectItem>
                      <SelectItem value="corner">Stick to Corner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="smooth-drag" className="text-gray-300">Enable Smooth Dragging</Label>
                  <Switch
                    id="smooth-drag"
                    checked={settings.behavior.smoothDragging}
                    onCheckedChange={(checked) => updateSetting('behavior', 'smoothDragging', checked)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Focus Tracker Settings */}
            <AccordionItem value="focus">
              <AccordionTrigger className="text-white hover:text-gray-300">
                Focus Tracker
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="focus-feedback" className="text-gray-300">Enable Focus Feedback</Label>
                  <Switch
                    id="focus-feedback"
                    checked={settings.focusTracker.enableFeedback}
                    onCheckedChange={(checked) => updateSetting('focusTracker', 'enableFeedback', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Nudge Frequency</Label>
                  <Select
                    value={settings.focusTracker.nudgeFrequency}
                    onValueChange={(value) => updateSetting('focusTracker', 'nudgeFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Idle Timeout: {settings.focusTracker.idleTimeout}s</Label>
                  <Slider
                    value={[settings.focusTracker.idleTimeout]}
                    onValueChange={([value]) => updateSetting('focusTracker', 'idleTimeout', value)}
                    min={30}
                    max={300}
                    step={15}
                    className="w-full"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Timer Settings */}
            <AccordionItem value="timer">
              <AccordionTrigger className="text-white hover:text-gray-300">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  Timer & Reminders
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Default Pomodoro Duration: {settings.timer.defaultDuration} min</Label>
                  <Slider
                    value={[settings.timer.defaultDuration]}
                    onValueChange={([value]) => updateSetting('timer', 'defaultDuration', value)}
                    min={15}
                    max={60}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="break-timer" className="text-gray-300">Enable Break Timer</Label>
                  <Switch
                    id="break-timer"
                    checked={settings.timer.enableBreakTimer}
                    onCheckedChange={(checked) => updateSetting('timer', 'enableBreakTimer', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sound-complete" className="text-gray-300">Play Sound on Complete</Label>
                  <Switch
                    id="sound-complete"
                    checked={settings.timer.playSoundOnComplete}
                    onCheckedChange={(checked) => updateSetting('timer', 'playSoundOnComplete', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="desktop-notifs" className="text-gray-300">Desktop Notifications</Label>
                  <Switch
                    id="desktop-notifs"
                    checked={settings.timer.desktopNotifications}
                    onCheckedChange={(checked) => updateSetting('timer', 'desktopNotifications', checked)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Spotify Settings */}
            <AccordionItem value="spotify">
              <AccordionTrigger className="text-white hover:text-gray-300">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  Spotify & Media
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Spotify Account</Label>
                  <Button 
                    size="sm" 
                    variant={settings.spotify.isConnected ? "destructive" : "default"}
                    onClick={() => updateSetting('spotify', 'isConnected', !settings.spotify.isConnected)}
                  >
                    {settings.spotify.isConnected ? 'Disconnect' : 'Connect'}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-play" className="text-gray-300">Auto-play Focus Playlist</Label>
                  <Switch
                    id="auto-play"
                    checked={settings.spotify.autoPlayFocusPlaylist}
                    onCheckedChange={(checked) => updateSetting('spotify', 'autoPlayFocusPlaylist', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Volume: {settings.spotify.volume}%</Label>
                  <Slider
                    value={[settings.spotify.volume]}
                    onValueChange={([value]) => updateSetting('spotify', 'volume', value)}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="now-playing" className="text-gray-300">Show Now Playing</Label>
                  <Switch
                    id="now-playing"
                    checked={settings.spotify.showNowPlaying}
                    onCheckedChange={(checked) => updateSetting('spotify', 'showNowPlaying', checked)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Storage Settings */}
            <AccordionItem value="storage">
              <AccordionTrigger className="text-white hover:text-gray-300">
                <div className="flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  Storage & Sync
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="local-save" className="text-gray-300">Enable Local Save</Label>
                  <Switch
                    id="local-save"
                    checked={settings.storage.enableLocalSave}
                    onCheckedChange={(checked) => updateSetting('storage', 'enableLocalSave', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="cloud-sync" className="text-gray-300">Enable Cloud Sync</Label>
                  <Switch
                    id="cloud-sync"
                    checked={settings.storage.enableCloudSync}
                    onCheckedChange={(checked) => updateSetting('storage', 'enableCloudSync', checked)}
                  />
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Button onClick={exportData} variant="outline" className="w-full">
                    Export Data (JSON)
                  </Button>
                  <Button onClick={clearAllData} variant="destructive" className="w-full">
                    Clear All Data
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Sticky Notes Settings */}
            <AccordionItem value="notes">
              <AccordionTrigger className="text-white hover:text-gray-300">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4" />
                  Sticky Notes
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Font Size</Label>
                  <Select
                    value={settings.stickyNotes.fontSize}
                    onValueChange={(value) => updateSetting('stickyNotes', 'fontSize', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Background Color</Label>
                  <Select
                    value={settings.stickyNotes.backgroundColor}
                    onValueChange={(value) => updateSetting('stickyNotes', 'backgroundColor', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yellow">Soft Yellow</SelectItem>
                      <SelectItem value="grey">Grey</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="pop-out" className="text-gray-300">Enable Pop-Out Notes</Label>
                  <Switch
                    id="pop-out"
                    checked={settings.stickyNotes.enablePopOut}
                    onCheckedChange={(checked) => updateSetting('stickyNotes', 'enablePopOut', checked)}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>

          <Separator className="my-6" />
          
          <div className="flex justify-center">
            <Button onClick={resetAllSettings} variant="outline" size="sm">
              Reset All to Default
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsPanel;
