
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Command, createCommandRegistry } from '@/commands/commandRegistry';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  setIsThemeManagerOpen: (open: boolean) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  setIsThemeManagerOpen,
}) => {
  const [search, setSearch] = useState('');
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const { workspaces, switchWorkspace, createWorkspace } = useWorkspace();

  const commands = useMemo(() => {
    return createCommandRegistry({
      switchWorkspace,
      createWorkspace,
      workspaces,
      setIsThemeManagerOpen,
    });
  }, [workspaces, switchWorkspace, createWorkspace, setIsThemeManagerOpen]);

  // Load recent commands from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('command-palette-recent');
    if (stored) {
      setRecentCommands(JSON.parse(stored));
    }
  }, []);

  // Save recent commands to localStorage
  const saveRecentCommand = (commandId: string) => {
    const updated = [commandId, ...recentCommands.filter(id => id !== commandId)].slice(0, 5);
    setRecentCommands(updated);
    localStorage.setItem('command-palette-recent', JSON.stringify(updated));
  };

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!search.trim()) {
      // Show recent commands when no search
      const recent = recentCommands
        .map(id => commands.find(cmd => cmd.id === id))
        .filter(Boolean) as Command[];
      return recent;
    }

    const searchLower = search.toLowerCase();
    return commands.filter(command =>
      command.label.toLowerCase().includes(searchLower) ||
      command.keywords.some(keyword => keyword.includes(searchLower)) ||
      command.category.toLowerCase().includes(searchLower)
    );
  }, [search, commands, recentCommands]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    
    filteredCommands.forEach(command => {
      if (!groups[command.category]) {
        groups[command.category] = [];
      }
      groups[command.category].push(command);
    });

    return groups;
  }, [filteredCommands]);

  const executeCommand = (command: Command) => {
    try {
      command.action();
      saveRecentCommand(command.id);
      onClose();
      setSearch('');
    } catch (error) {
      console.error('Command execution failed:', error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setSearch('');
    }
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={handleOpenChange}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        <CommandInput
          placeholder="Type a command or search..."
          value={search}
          onValueChange={setSearch}
          className="text-base"
        />
        <CommandList className="max-h-96">
          <CommandEmpty>No commands found.</CommandEmpty>
          
          {!search.trim() && recentCommands.length > 0 && (
            <CommandGroup heading="Recent">
              {Object.entries(groupedCommands).map(([category, commands]) => 
                commands.map((command) => (
                  <CommandItem
                    key={command.id}
                    value={command.id}
                    onSelect={() => executeCommand(command)}
                    className="flex items-center gap-3 py-3"
                  >
                    <span className="text-lg">{command.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{command.label}</div>
                      <div className="text-xs text-muted-foreground">{command.category}</div>
                    </div>
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          )}

          {search.trim() && Object.entries(groupedCommands).map(([category, commands]) => (
            <CommandGroup key={category} heading={category}>
              {commands.map((command) => (
                <CommandItem
                  key={command.id}
                  value={command.id}
                  onSelect={() => executeCommand(command)}
                  className="flex items-center gap-3 py-3"
                >
                  <span className="text-lg">{command.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{command.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {command.keywords.slice(0, 3).join(', ')}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </motion.div>
    </CommandDialog>
  );
};

export default CommandPalette;
