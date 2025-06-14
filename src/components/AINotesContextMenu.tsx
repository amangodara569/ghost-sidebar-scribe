
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { Brain, FileText, List, Mic } from 'lucide-react';

interface AINotesContextMenuProps {
  children: React.ReactNode;
  onSummarize: () => void;
  onRephrase: () => void;
  onConvertToTodos: () => void;
  onVoiceToNote: () => void;
  disabled?: boolean;
}

const AINotesContextMenu: React.FC<AINotesContextMenuProps> = ({
  children,
  onSummarize,
  onRephrase,
  onConvertToTodos,
  onVoiceToNote,
  disabled = false
}) => {
  if (disabled) {
    return <>{children}</>;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent 
        className="w-56"
        style={{
          backgroundColor: 'var(--theme-surface)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text)'
        }}
      >
        <ContextMenuItem 
          onClick={onSummarize}
          className="cursor-pointer"
        >
          <Brain className="w-4 h-4 mr-2" style={{ color: 'var(--theme-accent)' }} />
          <span>Summarize this note</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={onRephrase}
          className="cursor-pointer"
        >
          <FileText className="w-4 h-4 mr-2" style={{ color: 'var(--theme-accent)' }} />
          <span>Rephrase for clarity</span>
        </ContextMenuItem>
        
        <ContextMenuItem 
          onClick={onConvertToTodos}
          className="cursor-pointer"
        >
          <List className="w-4 h-4 mr-2" style={{ color: 'var(--theme-accent)' }} />
          <span>Turn into TODOs</span>
        </ContextMenuItem>
        
        <ContextMenuSeparator style={{ backgroundColor: 'var(--theme-border)' }} />
        
        <ContextMenuItem 
          onClick={onVoiceToNote}
          className="cursor-pointer"
        >
          <Mic className="w-4 h-4 mr-2" style={{ color: 'var(--theme-accent)' }} />
          <span>Generate note from voice</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default AINotesContextMenu;
