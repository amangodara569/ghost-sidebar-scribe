
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useVoiceEngine } from '@/hooks/useVoiceEngine';

interface VoiceControllerProps {
  isEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  onVoiceCommand: (command: string) => void;
}

const VoiceController: React.FC<VoiceControllerProps> = ({
  isEnabled,
  onToggleEnabled,
  onVoiceCommand,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const { 
    isListening, 
    settings, 
    lastCommand, 
    startListening, 
    stopListening, 
    updateSettings,
    commands 
  } = useVoiceEngine();

  // Handle voice commands
  useEffect(() => {
    const handleVoiceCommand = (event: CustomEvent) => {
      const { action, payload } = event.detail;
      onVoiceCommand(`${action}:${payload || ''}`);
    };

    window.addEventListener('voice:command', handleVoiceCommand as EventListener);
    return () => window.removeEventListener('voice:command', handleVoiceCommand as EventListener);
  }, [onVoiceCommand]);

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
      toast.info('Voice listening stopped');
    } else {
      startListening();
      toast.success('Voice listening started');
    }
  };

  return (
    <div className="p-4 space-y-3 border-t" style={{ borderColor: 'var(--theme-border)' }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
          Voice Commands
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Switch
            checked={isEnabled}
            onCheckedChange={onToggleEnabled}
          />
        </div>
      </div>

      {isEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3"
        >
          <Button
            onClick={handleToggleListening}
            variant={isListening ? "destructive" : "default"}
            size="sm"
            className="w-full"
          >
            <AnimatePresence mode="wait">
              {isListening ? (
                <motion.div
                  key="listening"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Mic className="w-4 h-4" />
                  </motion.div>
                  Stop Listening
                </motion.div>
              ) : (
                <motion.div
                  key="not-listening"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                  className="flex items-center gap-2"
                >
                  <MicOff className="w-4 h-4" />
                  Start Listening
                </motion.div>
              )}
            </AnimatePresence>    
          </Button>

          {lastCommand && (
            <div className="text-xs p-2 rounded" style={{ 
              backgroundColor: 'var(--theme-surface)', 
              color: 'var(--theme-text)' 
            }}>
              <span className="opacity-70">Last command:</span> "{lastCommand}"
            </div>
          )}

          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 p-3 rounded border"
              style={{ 
                backgroundColor: 'var(--theme-surface)', 
                borderColor: 'var(--theme-border)' 
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--theme-text)' }}>
                  Text-to-Speech
                </span>
                <Switch
                  checked={settings.useTTS}
                  onCheckedChange={(checked) => updateSettings({ useTTS: checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--theme-text)' }}>
                  Use Hotword
                </span>
                <Switch
                  checked={settings.useHotword}
                  onCheckedChange={(checked) => updateSettings({ useHotword: checked })}
                />
              </div>

              {settings.useHotword && (
                <div className="text-xs opacity-70" style={{ color: 'var(--theme-text)' }}>
                  Hotword: "{settings.hotword}"
                </div>
              )}
            </motion.div>
          )}

          <div className="text-xs opacity-70" style={{ color: 'var(--theme-text)' }}>
            Try: "Create note: Meeting notes", "Start 25 minute timer", "Pause music"
          </div>

          <div className="text-xs opacity-50" style={{ color: 'var(--theme-text)' }}>
            {commands.length} commands available
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VoiceController;
