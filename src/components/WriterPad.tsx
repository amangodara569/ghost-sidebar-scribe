import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Eye, EyeOff, Download, Copy, HelpCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface WriterPadProps {
  isOpen: boolean;
  onClose: () => void;
}

const WriterPad: React.FC<WriterPadProps> = ({ isOpen, onClose }) => {
  const [content, setContent] = useLocalStorage('writer-pad-content', '');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-save functionality
  const saveContent = useCallback(() => {
    setLastSaved(new Date());
    // Content is already saved to localStorage via useLocalStorage
    toast.success('Document saved', { duration: 2000 });
  }, []);

  // Auto-save every 5 seconds after user stops typing
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (content.trim()) {
        saveContent();
      }
    }, 5000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, saveContent]);

  // Update word count
  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [content]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      // Escape to exit fullscreen or close
      if (event.key === 'Escape') {
        event.preventDefault();
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }

      // Ctrl/Cmd + S to save
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        saveContent();
      }

      // Ctrl/Cmd + / for help
      if ((event.ctrlKey || event.metaKey) && event.key === '/') {
        event.preventDefault();
        setShowHelp(!showHelp);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFullscreen, showHelp, onClose, saveContent]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleExportMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notes-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Markdown file exported');
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(content);
    toast.success('All content copied to clipboard');
  };

  const markdownHelp = `
# Markdown Quick Reference

## Headers
# H1 Header
## H2 Header
### H3 Header

## Text Formatting
**Bold text**
*Italic text*
~~Strikethrough~~

## Lists
- Bullet point
- Another bullet
  - Nested bullet

1. Numbered list
2. Second item

## Code
\`inline code\`

\`\`\`javascript
// Code block
function hello() {
  console.log("Hello world!");
}
\`\`\`

## Links & More
[Link text](https://example.com)
> Blockquote
---
Horizontal line
  `;

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isFullscreen ? 'p-0' : 'p-4'
      }`}
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className={`relative flex flex-col transition-all duration-300 ${
          isFullscreen 
            ? 'w-full h-full' 
            : 'w-full max-w-6xl h-[90vh] rounded-xl shadow-2xl'
        }`}
        style={{
          backgroundColor: 'rgba(20, 20, 20, 0.95)',
          border: isFullscreen ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold text-white">✍️ Writer Mode</h2>
            <div className="text-sm text-gray-400">
              {wordCount} words
              {lastSaved && (
                <span className="ml-2">
                  • Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              title="Toggle Preview"
            >
              {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              Preview
            </Button>

            <Button
              onClick={() => setShowHelp(!showHelp)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              title="Markdown Help (Ctrl+/)"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>

            <Button
              onClick={saveContent}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              title="Save (Ctrl+S)"
            >
              <Save className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleCopyAll}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              title="Copy All"
            >
              <Copy className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleExportMarkdown}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              title="Export as .md"
            >
              <Download className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => setIsFullscreen(!isFullscreen)}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? '🗗' : '🗖'}
            </Button>

            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex min-h-0">
          {/* Help Panel */}
          {showHelp && (
            <div
              className="w-80 p-4 border-r overflow-y-auto"
              style={{
                borderColor: 'rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(30, 30, 30, 0.8)',
              }}
            >
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {markdownHelp}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Editor */}
          <div className={`flex-1 flex ${isPreviewMode ? '' : 'w-full'}`}>
            {!isPreviewMode || !isPreviewMode ? (
              <div className="flex-1 p-4">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Start typing anything... Use Markdown for formatting."
                  className="w-full h-full resize-none bg-transparent text-white placeholder-gray-400 outline-none"
                  style={{
                    fontSize: '16px',
                    lineHeight: '1.6',
                    fontFamily: '"JetBrains Mono", "Fira Code", "Inter", monospace',
                  }}
                />
              </div>
            ) : null}

            {/* Preview */}
            {isPreviewMode && (
              <div
                className="flex-1 p-4 overflow-y-auto border-l"
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  backgroundColor: 'rgba(30, 30, 30, 0.5)',
                }}
              >
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                  >
                    {content || '*Start typing to see preview...*'}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WriterPad;
