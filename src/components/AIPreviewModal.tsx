
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, Edit } from 'lucide-react';

interface AIPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (content: string) => void;
  title: string;
  originalContent: string;
  aiContent: string;
  isLoading: boolean;
  error?: string;
}

const AIPreviewModal: React.FC<AIPreviewModalProps> = ({
  isOpen,
  onClose,
  onAccept,
  title,
  originalContent,
  aiContent,
  isLoading,
  error
}) => {
  const [editedContent, setEditedContent] = useState(aiContent);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setEditedContent(aiContent);
    setIsEditing(false);
  }, [aiContent]);

  const handleAccept = () => {
    onAccept(editedContent);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
        style={{
          backgroundColor: 'var(--theme-surface)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text)'
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span style={{ color: 'var(--theme-text)' }}>{title}</span>
            <Badge 
              variant="outline" 
              style={{ 
                borderColor: 'var(--theme-accent)', 
                color: 'var(--theme-accent)' 
              }}
            >
              AI Assistant
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden grid grid-cols-2 gap-4">
          {/* Original Content */}
          <div className="flex flex-col">
            <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
              Original Note
            </h3>
            <div 
              className="flex-1 p-3 rounded border overflow-y-auto text-sm"
              style={{
                backgroundColor: 'var(--theme-background)',
                borderColor: 'var(--theme-border)',
                color: 'var(--theme-text-secondary)'
              }}
            >
              {originalContent}
            </div>
          </div>

          {/* AI Result */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>
                AI Result
              </h3>
              {!isLoading && !error && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditing(!isEditing)}
                  className="h-6 px-2"
                  style={{ color: 'var(--theme-text-secondary)' }}
                >
                  <Edit className="w-3 h-3" />
                </Button>
              )}
            </div>
            
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--theme-accent)' }} />
                <span className="ml-2" style={{ color: 'var(--theme-text-secondary)' }}>
                  Processing...
                </span>
              </div>
            ) : error ? (
              <div 
                className="flex-1 p-3 rounded border text-sm"
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: 'rgb(239, 68, 68)',
                  color: 'rgb(239, 68, 68)'
                }}
              >
                Error: {error}
              </div>
            ) : isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="flex-1 text-sm resize-none"
                style={{
                  backgroundColor: 'var(--theme-background)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text)'
                }}
              />
            ) : (
              <div 
                className="flex-1 p-3 rounded border overflow-y-auto text-sm whitespace-pre-wrap"
                style={{
                  backgroundColor: 'var(--theme-background)',
                  borderColor: 'var(--theme-accent)',
                  color: 'var(--theme-text)'
                }}
              >
                {editedContent}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            style={{
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-secondary)'
            }}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          
          {!isLoading && !error && (
            <Button
              onClick={handleAccept}
              style={{
                backgroundColor: 'var(--theme-accent)',
                color: 'white'
              }}
            >
              <Check className="w-4 h-4 mr-2" />
              Accept Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIPreviewModal;
