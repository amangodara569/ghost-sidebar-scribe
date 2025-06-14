
import { useState, useEffect, useCallback } from 'react';
import { voiceEngine, VoiceEngineSettings } from '@/services/VoiceEngine';

export const useVoiceEngine = () => {
  const [isListening, setIsListening] = useState(false);
  const [settings, setSettings] = useState<VoiceEngineSettings>(voiceEngine.getSettings());
  const [lastCommand, setLastCommand] = useState<string>('');

  useEffect(() => {
    const handleListening = (event: CustomEvent) => {
      setIsListening(event.detail.listening);
    };

    const handleCommand = (event: CustomEvent) => {
      setLastCommand(`${event.detail.action}: ${event.detail.payload || ''}`);
    };

    const handleError = (event: CustomEvent) => {
      console.error('Voice engine error:', event.detail.error);
    };

    const handleUnrecognized = (event: CustomEvent) => {
      setLastCommand(`Unrecognized: ${event.detail.transcript}`);
    };

    window.addEventListener('voice:listening', handleListening as EventListener);
    window.addEventListener('voice:command', handleCommand as EventListener);
    window.addEventListener('voice:error', handleError as EventListener);
    window.addEventListener('voice:unrecognized', handleUnrecognized as EventListener);

    return () => {
      window.removeEventListener('voice:listening', handleListening as EventListener);
      window.removeEventListener('voice:command', handleCommand as EventListener);
      window.removeEventListener('voice:error', handleError as EventListener);
      window.removeEventListener('voice:unrecognized', handleUnrecognized as EventListener);
    };
  }, []);

  const startListening = useCallback(() => {
    voiceEngine.startListening();
  }, []);

  const stopListening = useCallback(() => {
    voiceEngine.stopListening();
  }, []);

  const updateSettings = useCallback((newSettings: Partial<VoiceEngineSettings>) => {
    voiceEngine.updateSettings(newSettings);
    setSettings(voiceEngine.getSettings());
  }, []);

  const speak = useCallback((text: string) => {
    voiceEngine.speak(text);
  }, []);

  return {
    isListening,
    settings,
    lastCommand,
    startListening,
    stopListening,
    updateSettings,
    speak,
    commands: voiceEngine.getCommands()
  };
};
