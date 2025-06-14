
import React, { useState, useRef, useEffect } from 'react';
import { X, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarOverlayProps {
  children: React.ReactNode;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const SidebarOverlay: React.FC<SidebarOverlayProps> = ({ 
  children, 
  isVisible, 
  onToggleVisibility 
}) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [size, setSize] = useState({ width: 320, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === '`') {
        event.preventDefault();
        onToggleVisibility();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleVisibility]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      const rect = sidebarRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  if (!isVisible) return null;

  return (
    <div
      ref={sidebarRef}
      className="fixed z-50 bg-overlay backdrop-blur-md rounded-lg shadow-2xl border border-gray-600/30 overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        resize: 'both',
        minWidth: 280,
        minHeight: 400,
        maxWidth: 600,
        maxHeight: '90vh'
      }}
    >
      {/* Draggable Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-overlay-light cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
          <span className="text-sm text-gray-300 ml-2 font-medium">VibeMind</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-glass"
            onClick={onToggleVisibility}
          >
            <Minimize className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 hover:bg-glass"
            onClick={onToggleVisibility}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="h-full overflow-auto p-3 pb-16">
        {children}
      </div>

      {/* Resize Handle */}
      <div 
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100"
        style={{
          background: 'linear-gradient(-45deg, transparent 40%, rgba(156, 163, 175, 0.5) 50%, transparent 60%)'
        }}
      />
    </div>
  );
};

export default SidebarOverlay;
