
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Minimize, Maximize2, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface SidebarOverlayProps {
  children: React.ReactNode;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ResizeHandle {
  direction: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
  cursor: string;
}

const RESIZE_HANDLES: ResizeHandle[] = [
  { direction: 'n', cursor: 'n-resize' },
  { direction: 'ne', cursor: 'ne-resize' },
  { direction: 'e', cursor: 'e-resize' },
  { direction: 'se', cursor: 'se-resize' },
  { direction: 's', cursor: 's-resize' },
  { direction: 'sw', cursor: 'sw-resize' },
  { direction: 'w', cursor: 'w-resize' },
  { direction: 'nw', cursor: 'nw-resize' },
];

const SidebarOverlay: React.FC<SidebarOverlayProps> = ({ 
  children, 
  isVisible, 
  onToggleVisibility 
}) => {
  const [bounds, setBounds] = useLocalStorage<WindowBounds>('sidebar-bounds', {
    x: 50,
    y: 50,
    width: 380,
    height: 700
  });
  
  const [isMinimized, setIsMinimized] = useLocalStorage<boolean>('sidebar-minimized', false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ bounds: bounds, mouse: { x: 0, y: 0 } });
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const minimizedTabRef = useRef<HTMLDivElement>(null);

  // Constrain bounds to screen
  const constrainBounds = useCallback((newBounds: WindowBounds): WindowBounds => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    return {
      x: Math.max(0, Math.min(newBounds.x, screenWidth - newBounds.width)),
      y: Math.max(0, Math.min(newBounds.y, screenHeight - newBounds.height)),
      width: Math.max(280, Math.min(newBounds.width, screenWidth - 20)),
      height: Math.max(400, Math.min(newBounds.height, screenHeight - 20))
    };
  }, []);

  // Enhanced keyboard handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === '`') {
        event.preventDefault();
        if (isMinimized) {
          setIsMinimized(false);
        } else {
          onToggleVisibility();
        }
      }
      
      if (event.key === 'Escape' && isVisible && !isMinimized) {
        setIsMinimized(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleVisibility, isVisible, isMinimized]);

  // Drag functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMinimized) return;
    
    const target = e.target as HTMLElement;
    const isHeaderOrChild = target.closest('.draggable-header');
    
    if (isHeaderOrChild && e.button === 0) {
      e.preventDefault();
      e.stopPropagation();
      
      setIsDragging(true);
      const rect = sidebarRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
      document.body.style.cursor = 'grabbing';
    }
  }, [isMinimized]);

  // Resize functionality
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, direction: string) => {
    if (isMinimized) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(direction);
    setResizeStart({
      bounds: { ...bounds },
      mouse: { x: e.clientX, y: e.clientY }
    });
    
    const handle = RESIZE_HANDLES.find(h => h.direction === direction);
    document.body.style.cursor = handle?.cursor || 'default';
  }, [bounds, isMinimized]);

  // Mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const newBounds = constrainBounds({ ...bounds, x: newX, y: newY });
      setBounds(newBounds);
    } else if (isResizing) {
      e.preventDefault();
      const deltaX = e.clientX - resizeStart.mouse.x;
      const deltaY = e.clientY - resizeStart.mouse.y;
      
      let newBounds = { ...resizeStart.bounds };
      
      switch (isResizing) {
        case 'n':
          newBounds.y += deltaY;
          newBounds.height -= deltaY;
          break;
        case 'ne':
          newBounds.y += deltaY;
          newBounds.height -= deltaY;
          newBounds.width += deltaX;
          break;
        case 'e':
          newBounds.width += deltaX;
          break;
        case 'se':
          newBounds.width += deltaX;
          newBounds.height += deltaY;
          break;
        case 's':
          newBounds.height += deltaY;
          break;
        case 'sw':
          newBounds.x += deltaX;
          newBounds.width -= deltaX;
          newBounds.height += deltaY;
          break;
        case 'w':
          newBounds.x += deltaX;
          newBounds.width -= deltaX;
          break;
        case 'nw':
          newBounds.x += deltaX;
          newBounds.width -= deltaX;
          newBounds.y += deltaY;
          newBounds.height -= deltaY;
          break;
      }
      
      setBounds(constrainBounds(newBounds));
    }
  }, [isDragging, isResizing, dragOffset, bounds, resizeStart, constrainBounds, setBounds]);

  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(null);
      document.body.style.cursor = '';
    }
  }, [isDragging, isResizing]);

  // Mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Handle window resize
  useEffect(() => {
    const handleWindowResize = () => {
      setBounds(constrainBounds(bounds));
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [bounds, constrainBounds, setBounds]);

  // Minimize/restore functions
  const handleMinimize = () => setIsMinimized(true);
  const handleRestore = () => setIsMinimized(false);

  // Minimized tab component
  const MinimizedTab = () => (
    <motion.div
      ref={minimizedTabRef}
      className="fixed z-50 bg-gray-900/90 backdrop-blur-md rounded-r-lg shadow-2xl border-r border-gray-600/50 cursor-pointer hover:bg-gray-800/90 transition-colors"
      style={{
        left: 0,
        top: bounds.y + 100,
        width: 48,
        height: 120,
      }}
      onClick={handleRestore}
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -40, opacity: 0 }}
      whileHover={{ x: 4 }}
      role="button"
      aria-label="Restore VibeMind sidebar"
    >
      <div className="flex flex-col items-center justify-center h-full text-gray-300">
        <Maximize2 className="w-5 h-5 mb-2" />
        <div className="writing-mode-vertical text-xs font-medium">VibeMind</div>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {isMinimized ? (
            <MinimizedTab />
          ) : (
            <motion.div
              ref={sidebarRef}
              className="fixed z-50 bg-gray-900/85 backdrop-blur-md rounded-lg shadow-2xl border border-gray-600/30 overflow-hidden select-none"
              style={{
                left: bounds.x,
                top: bounds.y,
                width: bounds.width,
                height: bounds.height,
                cursor: isDragging ? 'grabbing' : 'default'
              }}
              initial={{
                opacity: 0,
                scale: 0.95,
                x: bounds.x + 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                x: bounds.x,
              }}
              exit={{
                opacity: 0,
                scale: 0.95,
                x: bounds.x + 20,
              }}
              transition={{
                duration: 0.3,
                ease: [0.4, 0.0, 0.2, 1]
              }}
              role="dialog"
              aria-label="VibeMind Sidebar"
              aria-modal="true"
            >
              {/* Draggable Header */}
              <motion.div
                className="draggable-header flex items-center justify-between px-3 py-2 bg-gray-800/60 border-b border-gray-600/30 select-none"
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDown}
                whileHover={{ backgroundColor: 'rgba(75, 85, 99, 0.4)' }}
              >
                <div className="flex items-center gap-2 pointer-events-none">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  <span className="text-sm text-gray-300 ml-2 font-medium">VibeMind</span>
                </div>
                
                <div className="flex items-center gap-1 pointer-events-auto">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                    onClick={handleMinimize}
                    aria-label="Minimize sidebar"
                  >
                    <Minimize className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 hover:bg-gray-700/50"
                    onClick={onToggleVisibility}
                    aria-label="Close sidebar"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>

              {/* Content Area */}
              <div className="h-full overflow-auto p-3 pb-16 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {children}
              </div>

              {/* Resize Handles */}
              {RESIZE_HANDLES.map(({ direction, cursor }) => (
                <div
                  key={direction}
                  className={`absolute bg-transparent hover:bg-blue-500/20 transition-colors ${
                    direction.includes('n') ? 'top-0' : direction.includes('s') ? 'bottom-0' : 'top-2 bottom-2'
                  } ${
                    direction.includes('w') ? 'left-0' : direction.includes('e') ? 'right-0' : 'left-2 right-2'
                  } ${
                    direction.length === 1 
                      ? (direction === 'n' || direction === 's') ? 'h-1 left-2 right-2' : 'w-1 top-2 bottom-2'
                      : 'w-3 h-3'
                  }`}
                  style={{ cursor }}
                  onMouseDown={(e) => handleResizeMouseDown(e, direction)}
                />
              ))}

              {/* Drag Handle */}
              <div className="absolute top-1/2 left-1 transform -translate-y-1/2 text-gray-500 opacity-50 hover:opacity-100 transition-opacity pointer-events-none">
                <GripHorizontal className="w-3 h-3 rotate-90" />
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default SidebarOverlay;
