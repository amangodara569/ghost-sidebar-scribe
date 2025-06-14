
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Minimize, Maximize2, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';

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

// Smooth easing constants
const DRAG_EASING = 0.15;
const EDGE_SNAP_THRESHOLD = 20;
const EDGE_SNAP_DISTANCE = 10;

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
  
  // Enhanced drag state management
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: bounds.x, y: bounds.y });
  const [targetPos, setTargetPos] = useState({ x: bounds.x, y: bounds.y });
  const [resizeStart, setResizeStart] = useState({ bounds: bounds, mouse: { x: 0, y: 0 } });
  
  // Animation and throttling refs
  const animationFrameRef = useRef<number>();
  const lastMouseMoveRef = useRef<number>(0);
  const throttleDelay = 16; // ~60fps
  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const minimizedTabRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Enhanced smooth animation loop with edge snapping
  const animateDrag = useCallback(() => {
    setCurrentPos(prev => {
      let newX = prev.x + (targetPos.x - prev.x) * DRAG_EASING;
      let newY = prev.y + (targetPos.y - prev.y) * DRAG_EASING;
      
      // Edge snapping logic
      if (isDragging) {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Left edge snap
        if (newX < EDGE_SNAP_THRESHOLD) {
          newX = newX < EDGE_SNAP_DISTANCE ? EDGE_SNAP_DISTANCE : newX;
        }
        
        // Right edge snap
        if (newX + bounds.width > screenWidth - EDGE_SNAP_THRESHOLD) {
          const snapX = screenWidth - bounds.width - EDGE_SNAP_DISTANCE;
          newX = newX > snapX ? snapX : newX;
        }
        
        // Top edge snap
        if (newY < EDGE_SNAP_THRESHOLD) {
          newY = newY < EDGE_SNAP_DISTANCE ? EDGE_SNAP_DISTANCE : newY;
        }
        
        // Bottom edge snap
        if (newY + bounds.height > screenHeight - EDGE_SNAP_THRESHOLD) {
          const snapY = screenHeight - bounds.height - EDGE_SNAP_DISTANCE;
          newY = newY > snapY ? snapY : newY;
        }
      }
      
      // Stop animation when close enough to target
      const threshold = 0.5;
      if (Math.abs(targetPos.x - newX) < threshold && Math.abs(targetPos.y - newY) < threshold) {
        return { x: targetPos.x, y: targetPos.y };
      }
      
      return { x: newX, y: newY };
    });
    
    if (isDragging || Math.abs(targetPos.x - currentPos.x) > 0.5 || Math.abs(targetPos.y - currentPos.y) > 0.5) {
      animationFrameRef.current = requestAnimationFrame(animateDrag);
    }
  }, [isDragging, targetPos, bounds.width, bounds.height, currentPos.x, currentPos.y]);

  // Start/stop animation loop
  useEffect(() => {
    if (isDragging || Math.abs(targetPos.x - currentPos.x) > 0.5 || Math.abs(targetPos.y - currentPos.y) > 0.5) {
      animationFrameRef.current = requestAnimationFrame(animateDrag);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, animateDrag]);

  // Update bounds when current position changes during drag
  useEffect(() => {
    if (isDragging) {
      setBounds(prev => ({ ...prev, x: currentPos.x, y: currentPos.y }));
    }
  }, [currentPos, isDragging, setBounds]);

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

  // Global hotkey handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Global hotkey: Ctrl + Shift + Space
      if (event.ctrlKey && event.shiftKey && event.code === 'Space') {
        event.preventDefault();
        event.stopPropagation();
        
        if (isVisible) {
          onToggleVisibility();
          toast({
            title: "Sidebar Hidden",
            description: "Press Ctrl+Shift+Space to bring back",
            duration: 3000,
          });
        } else {
          onToggleVisibility();
          if (isMinimized) {
            setIsMinimized(false);
          }
        }
        return;
      }
      
      // Legacy hotkey for backward compatibility
      if ((event.ctrlKey || event.metaKey) && event.key === '`') {
        event.preventDefault();
        if (isMinimized) {
          setIsMinimized(false);
        } else {
          onToggleVisibility();
        }
      }
      
      // Escape to minimize
      if (event.key === 'Escape' && isVisible && !isMinimized) {
        setIsMinimized(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [onToggleVisibility, isVisible, isMinimized, toast]);

  // Enhanced drag functionality with proper offset recording
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMinimized) return;
    
    const target = e.target as HTMLElement;
    const isHeaderOrChild = target.closest('.draggable-header');
    
    if (isHeaderOrChild && e.button === 0) {
      e.preventDefault();
      e.stopPropagation();
      
      setIsDragging(true);
      
      // Record proper offset from sidebar's current position
      const rect = sidebarRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
      
      // Prevent text selection during drag
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      document.body.style.pointerEvents = 'none';
      
      // Re-enable pointer events for the sidebar
      if (sidebarRef.current) {
        sidebarRef.current.style.pointerEvents = 'auto';
      }
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
    document.body.style.userSelect = 'none';
  }, [bounds, isMinimized]);

  // Enhanced mouse move handler with throttling
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const now = Date.now();
    
    // Throttle mouse move events
    if (now - lastMouseMoveRef.current < throttleDelay) {
      return;
    }
    lastMouseMoveRef.current = now;
    
    if (isDragging) {
      e.preventDefault();
      
      // Calculate new target position using recorded offset
      const newTargetX = e.clientX - dragOffset.x;
      const newTargetY = e.clientY - dragOffset.y;
      
      // Apply constraints and set target position
      const constrainedBounds = constrainBounds({ 
        ...bounds, 
        x: newTargetX, 
        y: newTargetY 
      });
      
      setTargetPos({ x: constrainedBounds.x, y: constrainedBounds.y });
      
    } else if (isResizing) {
      e.preventDefault();
      const deltaX = e.clientX - resizeStart.mouse.x;
      const deltaY = e.clientY - resizeStart.mouse.y;
      
      let newBounds = { ...resizeStart.bounds };
      
      // ... keep existing code (resize direction logic)
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

  // Enhanced mouse up handler
  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      setIsDragging(false);
      setIsResizing(null);
      
      // Restore normal cursor and selection
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
      
      if (sidebarRef.current) {
        sidebarRef.current.style.pointerEvents = '';
      }
      
      // Snap final position to target
      if (isDragging) {
        setCurrentPos({ x: targetPos.x, y: targetPos.y });
      }
    }
  }, [isDragging, isResizing, targetPos]);

  // Mouse event listeners
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  // Handle window resize
  useEffect(() => {
    const handleWindowResize = () => {
      const constrainedBounds = constrainBounds(bounds);
      setBounds(constrainedBounds);
      setCurrentPos({ x: constrainedBounds.x, y: constrainedBounds.y });
      setTargetPos({ x: constrainedBounds.x, y: constrainedBounds.y });
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [bounds, constrainBounds, setBounds]);

  // Sync positions when not dragging
  useEffect(() => {
    if (!isDragging) {
      setCurrentPos({ x: bounds.x, y: bounds.y });
      setTargetPos({ x: bounds.x, y: bounds.y });
    }
  }, [bounds.x, bounds.y, isDragging]);

  // Minimize/restore functions with debouncing
  const handleMinimize = () => setIsMinimized(true);
  const handleRestore = useCallback(() => {
    // Debounce to prevent rapid toggle
    setTimeout(() => {
      setIsMinimized(false);
    }, 100);
  }, []);

  // Minimized tab component
  const MinimizedTab = () => (
    <motion.div
      ref={minimizedTabRef}
      className="fixed z-50 minimized-tab cursor-pointer hover:bg-gray-800/90 transition-all duration-300"
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
      whileHover={{ x: 6, scale: 1.02 }}
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
              className="fixed z-50 floating-sidebar overflow-hidden select-none theme-transition"
              style={{
                left: currentPos.x,
                top: currentPos.y,
                width: bounds.width,
                height: bounds.height,
                cursor: isDragging ? 'grabbing' : 'default'
              }}
              initial={{
                opacity: 0,
                scale: 0.96,
                x: bounds.x + 20,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                x: bounds.x,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                x: bounds.x + 20,
              }}
              transition={{
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              role="dialog"
              aria-label="VibeMind Sidebar"
              aria-modal="true"
            >
              {/* Draggable Header */}
              <motion.div
                className="draggable-header floating-sidebar-header flex items-center justify-between px-4 py-3 select-none theme-transition"
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                onMouseDown={handleMouseDown}
                whileHover={{ backgroundColor: 'rgba(45, 45, 45, 0.8)' }}
              >
                <div className="flex items-center gap-3 pointer-events-none">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-sm" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-sm" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-sm" />
                  </div>
                  <span className="text-sm font-semibold ml-2" style={{ color: 'var(--theme-text)' }}>
                    VibeMind
                  </span>
                  <span className="text-xs opacity-60 ml-1" style={{ color: 'var(--theme-text-secondary)' }}>
                    Ctrl+Shift+Space
                  </span>
                </div>
                
                <div className="flex items-center gap-2 pointer-events-auto">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 rounded-md transition-all duration-300 hover:scale-110"
                    style={{
                      color: 'var(--theme-text-secondary)',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(60, 60, 60, 0.6)';
                      e.currentTarget.style.color = 'var(--theme-text)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--theme-text-secondary)';
                    }}
                    onClick={handleMinimize}
                    aria-label="Minimize sidebar"
                  >
                    <Minimize className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 rounded-md transition-all duration-300 hover:scale-110"
                    style={{
                      color: 'var(--theme-text-secondary)',
                      backgroundColor: 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.2)';
                      e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--theme-text-secondary)';
                    }}
                    onClick={onToggleVisibility}
                    aria-label="Close sidebar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </motion.div>

              {/* Content Area */}
              <div className="floating-sidebar-content h-full overflow-auto pb-20 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                {children}
              </div>

              {/* Resize Handles */}
              {RESIZE_HANDLES.map(({ direction, cursor }) => (
                <div
                  key={direction}
                  className={`absolute transition-colors duration-200 hover:bg-blue-500/10 ${
                    direction.includes('n') ? 'top-0' : direction.includes('s') ? 'bottom-0' : 'top-2 bottom-2'
                  } ${
                    direction.includes('w') ? 'left-0' : direction.includes('e') ? 'right-0' : 'left-2 right-2'
                  } ${
                    direction.length === 1 
                      ? (direction === 'n' || direction === 's') ? 'h-2 left-2 right-2' : 'w-2 top-2 bottom-2'
                      : 'w-4 h-4'
                  }`}
                  style={{ cursor }}
                  onMouseDown={(e) => handleResizeMouseDown(e, direction)}
                />
              ))}

              {/* Drag Handle */}
              <div className="absolute top-1/2 left-2 transform -translate-y-1/2 opacity-30 hover:opacity-60 transition-opacity duration-300 pointer-events-none">
                <GripHorizontal 
                  className="w-3 h-3 rotate-90" 
                  style={{ color: 'var(--theme-text-secondary)' }}
                />
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};

export default SidebarOverlay;
