
import { useMemo } from 'react';
import { Command } from '@/commands/commandRegistry';

export const useVoiceCommands = (commands: Command[]) => {
  const voiceCommandMap = useMemo(() => {
    const map: Record<string, Command> = {};
    
    commands.forEach(command => {
      // Create voice patterns for each command
      const patterns = [
        command.label.toLowerCase(),
        ...command.keywords.map(k => k.toLowerCase()),
      ];
      
      // Add common voice variations
      patterns.forEach(pattern => {
        map[pattern] = command;
        
        // Add variations for common voice commands
        if (pattern.includes('create') && pattern.includes('note')) {
          map['new note'] = command;
          map['add note'] = command;
          map['make a note'] = command;
        }
        
        if (pattern.includes('timer')) {
          map['start timer'] = command;
          map['begin timer'] = command;
          map['set timer'] = command;
        }
        
        if (pattern.includes('music') || pattern.includes('spotify')) {
          map['play music'] = command;
          map['start music'] = command;
          map['pause music'] = command;
          map['stop music'] = command;
        }
        
        if (pattern.includes('workspace')) {
          map['switch workspace'] = command;
          map['change workspace'] = command;
        }
        
        if (pattern.includes('sync')) {
          map['sync now'] = command;
          map['synchronize'] = command;
          map['backup now'] = command;
        }
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
    
    // Fuzzy matching - find commands that contain key words from transcript
    const words = cleanTranscript.split(' ');
    
    for (const [pattern, command] of Object.entries(voiceCommandMap)) {
      const patternWords = pattern.split(' ');
      const matchCount = words.filter(word => 
        patternWords.some(pWord => pWord.includes(word) || word.includes(pWord))
      ).length;
      
      // If more than half the words match, consider it a match
      if (matchCount > 0 && matchCount >= Math.min(words.length, patternWords.length) * 0.5) {
        return command;
      }
    }
    
    return null;
  };

  return { findCommandByVoice };
};
