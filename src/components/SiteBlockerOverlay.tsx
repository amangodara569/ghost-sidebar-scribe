
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Clock, ArrowLeft } from 'lucide-react';

interface SiteBlockerOverlayProps {
  siteName: string;
  onDisableFocusMode: () => void;
}

const SiteBlockerOverlay: React.FC<SiteBlockerOverlayProps> = ({ 
  siteName, 
  onDisableFocusMode 
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <Card className="max-w-md mx-4 text-center" style={{
        backgroundColor: 'var(--theme-surface)',
        borderColor: 'var(--theme-border)'
      }}>
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-red-500 bg-opacity-20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
          </div>
          <CardTitle className="text-xl" style={{ color: 'var(--theme-text)' }}>
            You're in Focus Mode
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--theme-text-secondary)' }}>
            Access to <strong>{siteName}</strong> is blocked while Focus Mode is active.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-xs" style={{ color: 'var(--theme-text-secondary)' }}>
            <Clock className="w-4 h-4" />
            <span>Stay focused on your goals</span>
          </div>
          
          <div className="flex flex-col gap-2 pt-4">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            
            <Button
              onClick={onDisableFocusMode}
              variant="destructive"
              size="sm"
              className="w-full"
            >
              Exit Focus Mode
            </Button>
          </div>
          
          <div className="text-xs pt-2" style={{ color: 'var(--theme-text-secondary)' }}>
            💡 Tip: Configure blocked sites in Settings
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SiteBlockerOverlay;
