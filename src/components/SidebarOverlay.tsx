
import React, { useState, useRef, useEffect } from 'react';
import { X, Minimize } from 'lucide-react';
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

const SidebarOverlay: React.FC<SidebarOverlayProps> = ({ 
  children, 
  isVisible, 
  onToggleVisibility 
}) => {
  const [bounds, setBounds] = useLocalStorage<WindowBounds>('sidebar-bounds', {
    x: 20,
    y: 20,
    width: 320,
    height: 600
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const sidebarRef = useRef<HTMLDivElement>(null);
  const lastSaveTime = useRef(Date.now());

  // Enhanced keyboard handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle with Ctrl/Cmd + `
      if ((event.ctrlKey || event.metaKey) && event.key === '`') {
        event.preventDefault();
        onToggleVisibility();
      }
      
      // Close with Escape when focused
      if (event.key === 'Escape' && isVisible) {
        const activeElement = document.activeElement;
        const sidebarElement = sidebarRef.current;
        if (sidebarElement && sidebarElement.contains(activeElement)) {
          onToggleVisibility();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleVisibility, isVisible]);

  // Debounced bounds saving
  const saveBounds = React.useCallback((newBounds: WindowBounds) => {
    const now = Date.now();
    if (now - lastSaveTime.current > 500) { // Debounce to 500ms
      setBounds(newBounds);
      lastSaveTime.current = now;
    }
  }, [setBounds]);

  // Edge snapping logic
  const snapToEdge = (x: number, y: number) => {
    const snapDistance = 20;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    let snappedX = x;
    let snappedY = y;
    
    // Snap to left edge
    if (x <= snapDistance) snappedX = 0;
    // Snap to right edge
    if (x + bounds.width >= screenWidth - snapDistance) snappedX = screenWidth - bounds.width;
    // Snap to top edge
    if (y <= snapDistance) snappedY = 0;
    // Snap to bottom edge
    if (y + bounds.height >= screenHeight - snapDistance) snappedY = screenHeight - bounds.height;
    
    return { x: snappedX, y: snappedY };
  };

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

  const handleMouseMove = React.useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      const snapped = snapToEdge(newX, newY);
      
      const newBounds = { ...bounds, x: snapped.x, y: snapped.y };
      setBounds(newBounds);
      saveBounds(newBounds);
    }
  }, [isDragging, dragOffset, bounds, saveBounds, snapToEdge]);

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle window resize for bounds validation
  useEffect(() => {
    const handleWindowResize = () => {
      const maxX = window.innerWidth - bounds.width;
      const maxY = window.innerHeight - bounds.height;
      
      if (bounds.x > maxX || bounds.y > maxY) {
        const newBounds = {
          ...bounds,
          x: Math.min(bounds.x, Math.max(0, maxX)),
          y: Math.min(bounds.y, Math.max(0, maxY))
        };
        setBounds(newBounds);
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [bounds, setBounds]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={sidebarRef}
          className="fixed z-50 bg-overlay backdrop-blur-md rounded-lg shadow-2xl border border-gray-600/30 overflow-hidden"
          style={{
            left: bounds.x,
            top: bounds.y,
            width: bounds.width,
            height: bounds.height,
            resize: 'both',
            minWidth: 280,
            minHeight: 400,
            maxWidth: 600,
            maxHeight: '90vh'
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
            className="flex items-center justify-between px-3 py-2 bg-overlay-light cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-2">
              <motion.div 
                className="w-3 h-3 rounded-full bg-red-500/70"
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 1)' }}
                transition={{ duration: 0.2 }}
              />
              <motion.div 
                className="w-3 h-3 rounded-full bg-yellow-500/70"
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(245, 158, 11, 1)' }}
                transition={{ duration: 0.2 }}
              />
              <motion.div 
                className="w-3 h-3 rounded-full bg-green-500/70"
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(34, 197, 94, 1)' }}
                transition={{ duration: 0.2 }}
              />
              <span className="text-sm text-gray-300 ml-2 font-medium">VibeMind</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-glass"
                onClick={onToggleVisibility}
                aria-label="Minimize sidebar"
                tabIndex={0}
              >
                <Minimize className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 hover:bg-glass"
                onClick={onToggleVisibility}
                aria-label="Close sidebar"
                tabIndex={0}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </motion.div>

          {/* Content Area */}
          <motion.div 
            className="h-full overflow-auto p-3 pb-16"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {children}
          </motion.div>

          {/* Resize Handle */}
          <motion.div 
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100"
            style={{
              background: 'linear-gradient(-45deg, transparent 40%, rgba(156, 163, 175, 0.5) 50%, transparent 60%)'
            }}
            whileHover={{ scale: 1.2 }}
            transition={{ duration: 0.2 }}
            aria-label="Resize sidebar"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SidebarOverlay;
