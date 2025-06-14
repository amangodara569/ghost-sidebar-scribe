
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Brain, BarChart3, Palette, Grid3X3 } from 'lucide-react';
import FocusMode from './FocusMode';
import SettingsPanel from './SettingsPanel';
import ThemeManager from './ThemeManager';
import AISettingsPanel from './AISettingsPanel';
import AnalyticsTab from './AnalyticsTab';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { trackActivity } from '@/services/analyticsEngine';
import { toast } from 'sonner';

// Widget imports
import NotesWidget from './widgets/NotesWidget';
import ToDoWidget from './widgets/ToDoWidget';
import TimerWidget from './widgets/TimerWidget';
import SpotifyWidget from './widgets/SpotifyWidget';
import StickyNotesWidget from './widgets/StickyNotesWidget';

const WidgetContainer: React.FC = () => {
  const [activeTab, setActiveTab] = useLocalStorage('active-tab', 'focus');
  const [showSettings, setShowSettings] = useState(false);
  const [showThemeManager, setShowThemeManager] = useState(false);

  useEffect(() => {
    trackActivity('system', 'widget-container-mounted');
  }, []);

  const tabs = [
    { id: 'focus', label: 'Focus', icon: Brain },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'focus':
        return (
          <div className="p-4 max-w-md mx-auto">
            <FocusMode />
          </div>
        );
      case 'analytics':
        return <AnalyticsTab />;
      case 'settings':
        return (
          <div className="p-4">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Quick Actions */}
              <div className="flex gap-4 mb-6">
                <Button
                  onClick={() => setShowSettings(true)}
                  className="flex items-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Open Settings
                </Button>
                <Button
                  onClick={() => setShowThemeManager(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Palette className="w-4 h-4" />
                  Theme Switcher
                </Button>
              </div>
              
              {/* Widgets Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Grid3X3 className="w-5 h-5" />
                    Productivity Tools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <NotesWidget widgetId="notes-main" />
                    <ToDoWidget widgetId="todo-main" />
                    <TimerWidget widgetId="timer-main" />
                    <SpotifyWidget widgetId="spotify-main" />
                    <StickyNotesWidget widgetId="sticky-notes-main" />
                  </div>
                </CardContent>
              </Card>
              
              {/* AI Settings */}
              <div className="mt-8">
                <AISettingsPanel />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="flex items-center justify-center bg-muted">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="data-[state=active]:bg-secondary">
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={activeTab} className="flex-1 overflow-auto">
          {renderContent()}
        </TabsContent>
      </Tabs>

      <SettingsPanel isOpen={showSettings} onClose={() => setShowSettings(false)} />
      <ThemeManager isOpen={showThemeManager} onClose={() => setShowThemeManager(false)} />
    </div>
  );
};

export default WidgetContainer;
