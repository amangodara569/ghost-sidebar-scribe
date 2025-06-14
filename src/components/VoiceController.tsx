
import React, { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

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
  const [isListening, setIsListening] = useState(false);
  const [lastCommand, setLastCommand] = useState<string>('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
      setIsListening(true);
      console.log('Voice recognition started');
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      console.log('Voice recognition ended');
    };

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      const lastResult = event.results[event.results.length - 1];
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript.trim().toLowerCase();
        console.log('Voice command:', transcript);
        setLastCommand(transcript);
        onVoiceCommand(transcript);
      }
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      toast.error(`Voice recognition error: ${event.error}`);
    };

    setRecognition(recognitionInstance);

    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [onVoiceCommand]);

  const startListening = () => {
    if (recognition && isEnabled && !isListening) {
      try {
        recognition.start();
        toast.success('Voice listening started');
      } catch (error) {
        console.error('Failed to start recognition:', error);
        toast.error('Failed to start voice recognition');
      }
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      toast.info('Voice listening stopped');
    }
  };

  const handleToggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const speakResponse = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Speak confirmations when commands are processed
  useEffect(() => {
    if (lastCommand && isEnabled) {
      // Simple confirmation based on command type
      if (lastCommand.includes('timer')) {
        speakResponse('Timer command executed');
      } else if (lastCommand.includes('music') || lastCommand.includes('spotify')) {
        speakResponse('Music command executed');
      } else if (lastCommand.includes('note')) {
        speakResponse('Note command executed');
      } else if (lastCommand.includes('workspace')) {
        speakResponse('Workspace switched');
      } else {
        speakResponse('Command executed');
      }
    }
  }, [lastCommand, isEnabled]);

  return (
    <div className="p-4 space-y-3 border-t" style={{ borderColor: 'var(--theme-border)' }}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
          Voice Commands
        </span>
        <Switch
          checked={isEnabled}
          onCheckedChange={onToggleEnabled}
        />
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

          <div className="text-xs opacity-70" style={{ color: 'var(--theme-text)' }}>
            Try: "Create new note", "Start timer", "Play music"
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default VoiceController;
