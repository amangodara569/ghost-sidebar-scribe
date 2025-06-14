
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useBackgroundTasks } from '@/hooks/useBackgroundTasks';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';

interface TimerWidgetProps {
  widgetId: string;
}

const TimerWidget: React.FC<TimerWidgetProps> = ({ widgetId }) => {
  const [duration, setDuration] = useLocalStorage(`timer-duration-${widgetId}`, 25);
  const [timeLeft, setTimeLeft] = useLocalStorage(`timer-time-left-${widgetId}`, 25 * 60);
  const [isRunning, setIsRunning] = useLocalStorage(`timer-is-running-${widgetId}`, false);
  const [lastUpdateTime, setLastUpdateTime] = useLocalStorage(`timer-last-update-${widgetId}`, Date.now());
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { logCustomMetric } = usePerformanceMonitor('TimerWidget');
  const { registerTask, unregisterTask } = useBackgroundTasks();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize timer state only once on mount
  useEffect(() => {
    if (!isInitialized) {
      if (isRunning && timeLeft > 0) {
        const now = Date.now();
        const timePassed = Math.floor((now - lastUpdateTime) / 1000);
        const newTimeLeft = Math.max(0, timeLeft - timePassed);
        
        if (newTimeLeft > 0) {
          setTimeLeft(newTimeLeft);
          startCountdown();
        } else {
          setTimeLeft(0);
          setIsRunning(false);
          handleTimerComplete();
        }
      }
      setIsInitialized(true);
    }
  }, [isInitialized, isRunning, timeLeft, lastUpdateTime]);

  const startCountdown = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        setLastUpdateTime(Date.now());
        
        if (newTime <= 0) {
          setIsRunning(false);
          handleTimerComplete();
          return 0;
        }
        return newTime;
      });
    }, 1000);
  };

  const handleTimerComplete = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    toast.success("⏰ Time's up!", {
      description: "Your timer has finished!",
      duration: 5000,
    });
    
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    
    logCustomMetric('timer-completed', duration);
  };

  const handleStart = () => {
    if (timeLeft <= 0) {
      setTimeLeft(duration * 60);
    }
    
    setIsRunning(true);
    setLastUpdateTime(Date.now());
    startCountdown();
    logCustomMetric('timer-started', timeLeft);
  };

  const handlePause = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    logCustomMetric('timer-paused', timeLeft);
  };

  const handleReset = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setTimeLeft(duration * 60);
    setLastUpdateTime(Date.now());
    logCustomMetric('timer-reset', 1);
  };

  const handleDurationChange = (newDuration: number) => {
    if (newDuration > 0 && newDuration <= 999) {
      setDuration(newDuration);
      if (!isRunning) {
        setTimeLeft(newDuration * 60);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Register background task for persistence
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      registerTask({
        id: `timer-${widgetId}`,
        interval: 1000,
        callback: () => {
          setLastUpdateTime(Date.now());
        },
        enabled: true
      });
    } else {
      unregisterTask(`timer-${widgetId}`);
    }

    return () => unregisterTask(`timer-${widgetId}`);
  }, [isRunning, timeLeft, widgetId, registerTask, unregisterTask]);

  if (!isInitialized) {
    return <div className="bg-transparent border-none p-3">Loading...</div>;
  }

  return (
    <motion.div 
      className="bg-transparent border-none p-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-200">Timer</h3>
      </div>

      {/* Duration Input */}
      <div className="mb-3">
        <label htmlFor="timer-duration" className="block text-xs text-gray-400 mb-1">
          Duration (minutes)
        </label>
        <Input
          id="timer-duration"
          type="number"
          min="1"
          max="999"
          value={duration}
          onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1)}
          disabled={isRunning}
          className="sidebar-input text-center"
          placeholder="25"
        />
      </div>

      {/* Time Display */}
      <motion.div 
        className="text-center mb-3"
        animate={{ scale: isRunning && timeLeft <= 10 ? [1, 1.05, 1] : 1 }}
        transition={{ duration: 1, repeat: isRunning && timeLeft <= 10 ? Infinity : 0 }}
      >
        <motion.div 
          className={`text-3xl font-mono font-bold transition-colors duration-300 ${
            timeLeft <= 0 ? 'text-red-400' : 
            timeLeft <= 60 ? 'text-yellow-400' : 
            'text-blue-400'
          }`}
          key={timeLeft}
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.1 }}
          aria-live="polite"
          aria-label={`Time remaining: ${formatTime(timeLeft)}`}
        >
          {formatTime(timeLeft)}
        </motion.div>
        <div className="text-xs text-gray-400 mt-1">
          {timeLeft <= 0 ? 'Timer finished!' : isRunning ? 'Running...' : 'Ready to start'}
        </div>
      </motion.div>

      {/* Control Buttons */}
      <div className="flex justify-center gap-2 mb-3" role="group" aria-label="Timer controls">
        <AnimatePresence mode="wait">
          {!isRunning ? (
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={handleStart}
                disabled={duration <= 0}
                className="bg-green-600 hover:bg-green-700 h-8 px-4 text-sm transition-all duration-200 hover:scale-105"
                size="sm"
                aria-label="Start timer"
              >
                <Play className="w-4 h-4 mr-1" />
                Start
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="pause"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={handlePause}
                className="bg-yellow-600 hover:bg-yellow-700 h-8 px-4 text-sm transition-all duration-200 hover:scale-105"
                size="sm"
                aria-label="Pause timer"
              >
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            onClick={handleReset}
            className="bg-overlay-light border-gray-600 text-gray-200 hover:bg-glass h-8 px-4 text-sm transition-all duration-200"
            size="sm"
            aria-label="Reset timer"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-1.5 mb-2">
        <motion.div
          className={`h-1.5 rounded-full transition-colors duration-300 ${
            timeLeft <= 0 ? 'bg-red-400' : 
            timeLeft <= 60 ? 'bg-yellow-400' : 
            'bg-blue-400'
          }`}
          initial={{ width: 0 }}
          animate={{ 
            width: `${Math.max(0, Math.min(100, (timeLeft / (duration * 60)) * 100))}%` 
          }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Status Text */}
      <div className="text-center text-xs text-gray-500">
        {timeLeft > 0 && (
          <span>
            {Math.floor(timeLeft / 60)}m {timeLeft % 60}s remaining
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default TimerWidget;
