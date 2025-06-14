
import { useMemo } from 'react';
import { Command } from '@/commands/commandRegistry';
import { voiceEngine } from '@/services/VoiceEngine';

export const useVoiceCommands = (commands: Command[]) => {
  const voiceCommandMap = useMemo(() => {
    const map: Record<string, Command> = {};
    
    commands.forEach(command => {
      // Register with voice engine
      voiceEngine.registerCommand({
        pattern: new RegExp(command.label.toLowerCase().replace(/\s+/g, '\\s+'), 'i'),
        action: command.id,
        handler: () => command.action(),
        description: command.label
      });

      // Create voice patterns for each command
      const patterns = [
        command.label.toLowerCase(),
        ...command.keywords.map(k => k.toLowerCase()),
      ];
      
      patterns.forEach(pattern => {
        map[pattern] = command;
      });
    });
    
    return map;
  }, [commands]);

  const findCommandByVoice = (transcript: string): Command | null => {
    const cleanTranscript = transcript.toLowerCase().trim();
    
    // Direct match first
    if (voiceCommandMap[cleanTranscript]) {
      return voiceCommandMap[cleanTranscript];
    }
    
    // Fuzzy matching
    const words = cleanTranscript.split(' ');
    
    for (const [pattern, command] of Object.entries(voiceCommandMap)) {
      const patternWords = pattern.split(' ');
      const matchCount = words.filter(word => 
        patternWords.some(pWord => pWord.includes(word) || word.includes(pWord))
      ).length;
      
      if (matchCount > 0 && matchCount >= Math.min(words.length, patternWords.length) * 0.5) {
        return command;
      }
    }
    
    return null;
  };

  return { findCommandByVoice };
};
