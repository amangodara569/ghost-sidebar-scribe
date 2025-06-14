
import { toast } from 'sonner';

export interface Command {
  id: string;
  label: string;
  keywords: string[];
  category: string;
  action: () => void | Promise<void>;
  icon?: string;
}

export const createCommandRegistry = (context: {
  switchWorkspace: (id: string) => void;
  createWorkspace: (name: string) => void;
  workspaces: any[];
  setIsThemeManagerOpen: (open: boolean) => void;
  // Add more context as needed
}) => {
  const commands: Command[] = [
    // Workspace Commands
    ...context.workspaces.map(workspace => ({
      id: `switch-workspace-${workspace.id}`,
      label: `Switch to ${workspace.name}`,
      keywords: ['switch', 'workspace', workspace.name.toLowerCase()],
      category: 'Workspace',
      action: () => context.switchWorkspace(workspace.id),
      icon: '🏢',
    })),
    {
      id: 'create-workspace',
      label: 'Create New Workspace',
      keywords: ['create', 'new', 'workspace'],
      category: 'Workspace',
      action: () => {
        const name = prompt('Enter workspace name:');
        if (name) context.createWorkspace(name);
      },
      icon: '➕',
    },

    // Theme Commands
    {
      id: 'open-theme-manager',
      label: 'Open Theme Manager',
      keywords: ['theme', 'style', 'appearance', 'color'],
      category: 'Appearance',
      action: () => context.setIsThemeManagerOpen(true),
      icon: '🎨',
    },

    // Widget Commands
    {
      id: 'create-note',
      label: 'Create New Note',
      keywords: ['note', 'create', 'new', 'write'],
      category: 'Widgets',
      action: () => {
        // Dispatch event to create new note
        window.dispatchEvent(new CustomEvent('command:create-note'));
        toast.success('Creating new note...');
      },
      icon: '📝',
    },
    {
      id: 'create-todo',
      label: 'Create New Todo',
      keywords: ['todo', 'task', 'create', 'new'],
      category: 'Widgets',
      action: () => {
        window.dispatchEvent(new CustomEvent('command:create-todo'));
        toast.success('Creating new todo...');
      },
      icon: '✅',
    },
    {
      id: 'start-timer',
      label: 'Start Timer',
      keywords: ['timer', 'start', 'pomodoro'],
      category: 'Widgets',
      action: () => {
        window.dispatchEvent(new CustomEvent('command:start-timer'));
        toast.success('Starting timer...');
      },
      icon: '⏱️',
    },
    {
      id: 'pause-timer',
      label: 'Pause Timer',
      keywords: ['timer', 'pause', 'stop'],
      category: 'Widgets',
      action: () => {
        window.dispatchEvent(new CustomEvent('command:pause-timer'));
        toast.success('Timer paused');
      },
      icon: '⏸️',
    },

    // Spotify Commands
    {
      id: 'spotify-play-pause',
      label: 'Play/Pause Music',
      keywords: ['spotify', 'music', 'play', 'pause'],
      category: 'Music',
      action: () => {
        window.dispatchEvent(new CustomEvent('command:spotify-toggle'));
        toast.success('Toggling music...');
      },
      icon: '🎵',
    },
    {
      id: 'spotify-next',
      label: 'Next Track',
      keywords: ['spotify', 'next', 'skip', 'music'],
      category: 'Music',
      action: () => {
        window.dispatchEvent(new CustomEvent('command:spotify-next'));
        toast.success('Skipping to next track...');
      },
      icon: '⏭️',
    },

    // System Commands
    {
      id: 'sync-now',
      label: 'Sync Now',
      keywords: ['sync', 'backup', 'save'],
      category: 'System',
      action: () => {
        window.dispatchEvent(new CustomEvent('command:sync-now'));
        toast.success('Syncing data...');
      },
      icon: '🔄',
    },
    {
      id: 'toggle-notifications',
      label: 'Toggle Notifications',
      keywords: ['notifications', 'toggle', 'enable', 'disable'],
      category: 'System',
      action: () => {
        window.dispatchEvent(new CustomEvent('command:toggle-notifications'));
        toast.success('Toggled notifications');
      },
      icon: '🔔',
    },

    // Quick Actions
    {
      id: 'quick-reminder',
      label: 'Set Quick Reminder',
      keywords: ['reminder', 'quick', 'notify'],
      category: 'Quick Actions',
      action: () => {
        const message = prompt('Reminder text:');
        const minutes = prompt('Minutes from now:');
        if (message && minutes) {
          window.dispatchEvent(new CustomEvent('command:quick-reminder', {
            detail: { message, minutes: parseInt(minutes) }
          }));
          toast.success(`Reminder set for ${minutes} minutes`);
        }
      },
      icon: '⏰',
    },
  ];

  return commands;
};
