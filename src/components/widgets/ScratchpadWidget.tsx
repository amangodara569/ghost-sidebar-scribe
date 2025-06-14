
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ScratchpadWidgetProps {
  widgetId: string;
}

const ScratchpadWidget: React.FC<ScratchpadWidgetProps> = ({ widgetId }) => {
  const [content, setContent] = useLocalStorage(`scratchpad-content-${widgetId}`, '');
  const [isCollapsed, setIsCollapsed] = useLocalStorage(`scratchpad-collapsed-${widgetId}`, false);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const savedIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save functionality
  useEffect(() => {
    if (isTyping) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        setShowSavedIndicator(true);
        
        // Hide saved indicator after 2 seconds
        if (savedIndicatorTimeoutRef.current) {
          clearTimeout(savedIndicatorTimeoutRef.current);
        }
        savedIndicatorTimeoutRef.current = setTimeout(() => {
          setShowSavedIndicator(false);
        }, 2000);
      }, 1000); // Auto-save after 1 second of inactivity
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (savedIndicatorTimeoutRef.current) {
        clearTimeout(savedIndicatorTimeoutRef.current);
      }
    };
  }, [content, isTyping]);

  const handleContentChange = (value: string) => {
    setContent(value);
    setIsTyping(true);
    setShowSavedIndicator(false);
  };

  const handleClear = () => {
    setContent('');
    setIsTyping(false);
    setShowSavedIndicator(false);
    toast.success('Scratchpad cleared');
    
    // Focus back to textarea after clearing
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 100);
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 300; // Maximum height in pixels
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [content]);

  return (
    <motion.div 
      className="bg-transparent border-none p-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-200">Scratchpad</h3>
          <AnimatePresence>
            {showSavedIndicator && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1 text-xs text-green-400"
              >
                <Check className="w-3 h-3" />
                <span>Saved</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex items-center gap-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                disabled={!content.trim()}
                title="Clear scratchpad"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-gray-900 border-gray-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-gray-100">Clear Scratchpad</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-300">
                  Are you sure you want to clear your scratchpad? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-gray-800 text-gray-200 border-gray-600 hover:bg-gray-700">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleClear}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Clear
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
            title={isCollapsed ? "Expand scratchpad" : "Collapse scratchpad"}
          >
            {isCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Dump your brain here…"
              className="sidebar-textarea resize-none min-h-[120px] transition-all duration-200 focus:ring-2 focus:ring-blue-500/50"
              style={{
                maxHeight: '300px',
                overflowY: content.length > 500 ? 'auto' : 'hidden',
              }}
              spellCheck={false}
            />
            
            {/* Character count indicator */}
            {content.length > 0 && (
              <div className="text-xs text-gray-500 mt-2 text-right">
                {content.length} characters
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed state preview */}
      {isCollapsed && content.trim() && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-400 truncate cursor-pointer"
          onClick={() => setIsCollapsed(false)}
          title="Click to expand"
        >
          {content.trim().substring(0, 50)}{content.length > 50 ? '...' : ''}
        </motion.div>
      )}
    </motion.div>
  );
};

export default ScratchpadWidget;
