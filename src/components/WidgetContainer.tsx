import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Grid3X3, Settings, Brain, X, BarChart3 } from 'lucide-react';
import FocusMode from './FocusMode';
import SettingsPanel from './SettingsPanel';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { trackActivity } from '@/services/analyticsEngine';
import { useVibeAnalytics } from '@/hooks/useVibeAnalytics';
import { toast } from 'sonner';
import AnalyticsTab from './AnalyticsTab';

const WidgetContainer: React.FC = () => {
  const [activeTab, setActiveTab] = useLocalStorage('active-tab', 'widgets');

  useEffect(() => {
    trackActivity('system', 'widget-container-mounted');
  }, []);

  const tabs = [
    { id: 'widgets', label: 'Widgets', icon: Grid3X3 },
    { id: 'focus', label: 'Focus', icon: Brain },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'widgets':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
            {/* Add your widgets here */}
            <Card>
              <CardHeader>
                <CardTitle>Widget 1</CardTitle>
              </CardHeader>
              <CardContent>Content for Widget 1</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Widget 2</CardTitle>
              </CardHeader>
              <CardContent>Content for Widget 2</CardContent>
            </Card>
          </div>
        );
      case 'focus':
        return (
          <div className="p-4 max-w-md mx-auto">
            <FocusMode />
          </div>
        );
      case 'analytics':
        return <AnalyticsTab />;
      case 'settings':
        return <SettingsPanel />;
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
    </div>
  );
};

export default WidgetContainer;
