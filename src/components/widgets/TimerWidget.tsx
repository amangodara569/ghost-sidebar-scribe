
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useBackgroundTasks } from '@/hooks/useBackgroundTasks';

interface TimerSession {
  id: string;
  type: 'work' | 'break';
  duration: number;
  startTime: string;
  endTime?: string;
  completed: boolean;
}

interface TimerWidgetProps {
  widgetId: string;
}

const TimerWidget: React.FC<TimerWidgetProps> = ({ widgetId }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [currentSession, setCurrentSession] = useState<'work' | 'break'>('work');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [mode, setMode] = useState<'pomodoro' | 'timer' | 'stopwatch'>('pomodoro');

  const WORK_DURATION = 25 * 60; // 25 minutes
  const BREAK_DURATION = 5 * 60; // 5 minutes

  const { logCustomMetric } = usePerformanceMonitor('TimerWidget');
  const { registerTask, unregisterTask } = useBackgroundTasks();

  // Background timer task
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      registerTask({
        id: 'timer-countdown',
        interval: 1000,
        callback: () => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              setIsRunning(false);
              handleSessionComplete();
              return 0;
            }
            return prev - 1;
          });
        },
        enabled: true
      });
    } else {
      unregisterTask('timer-countdown');
    }

    return () => unregisterTask('timer-countdown');
  }, [isRunning, timeLeft, registerTask, unregisterTask]);

  const handleSessionComplete = () => {
    // Play notification sound or show toast
    console.log('Timer completed!');
    logCustomMetric('session-completed', 1);
    
    if (mode === 'pomodoro') {
      if (currentSession === 'work') {
        setSessionsCompleted(prev => prev + 1);
        setCurrentSession('break');
        setTimeLeft(BREAK_DURATION);
      } else {
        setCurrentSession('work');
        setTimeLeft(WORK_DURATION);
      }
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    logCustomMetric('timer-started', timeLeft);
    console.log('Timer started:', { mode, timeLeft, currentSession });
  };

  const handlePause = () => {
    setIsRunning(false);
    logCustomMetric('timer-paused', timeLeft);
    console.log('Timer paused');
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(currentSession === 'work' ? WORK_DURATION : BREAK_DURATION);
    logCustomMetric('timer-reset', 1);
    console.log('Timer reset');
  };

  const handleModeChange = (newMode: 'pomodoro' | 'timer' | 'stopwatch') => {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === 'pomodoro') {
      setTimeLeft(WORK_DURATION);
      setCurrentSession('work');
    } else if (newMode === 'timer') {
      setTimeLeft(25 * 60);
    } else {
      setTimeLeft(0);
    }
    logCustomMetric('mode-changed', newMode === 'pomodoro' ? 1 : newMode === 'timer' ? 2 : 3);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(Math.abs(seconds) / 60);
    const secs = Math.abs(seconds) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionColor = () => {
    if (mode === 'pomodoro') {
      return currentSession === 'work' ? 'text-red-400' : 'text-green-400';
    }
    return 'text-blue-400';
  };

  const getSessionLabel = () => {
    if (mode === 'pomodoro') {
      return currentSession === 'work' ? 'Work Session' : 'Break Time';
    } else if (mode === 'timer') {
      return 'Timer';
    }
    return 'Stopwatch';
  };

  return (
    <motion.div 
      className="bg-transparent border-none p-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-200">Timer</h3>
        <div className="flex gap-1" role="tablist" aria-label="Timer modes">
          {['pomodoro', 'timer', 'stopwatch'].map((m) => (
            <Button
              key={m}
              size="sm"
              variant={mode === m ? "default" : "outline"}
              onClick={() => handleModeChange(m as any)}
              className={`text-xs h-6 px-2 transition-all duration-200 ${
                mode === m 
                  ? 'bg-purple-600 text-white shadow-lg scale-105' 
                  : 'bg-overlay-light border-gray-600 text-gray-300 hover:scale-105'
              }`}
              role="tab"
              aria-selected={mode === m}
              aria-label={`Switch to ${m} mode`}
              tabIndex={0}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <motion.div 
        className="text-center mb-3"
        animate={{ scale: isRunning ? 1.02 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <div 
          className={`text-2xl font-mono font-bold ${getSessionColor()} transition-colors duration-300`}
          aria-live="polite"
          aria-label={`Time remaining: ${formatTime(timeLeft)}`}
        >
          {formatTime(timeLeft)}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {getSessionLabel()}
        </div>
      </motion.div>

      <AnimatePresence>
        {mode === 'pomodoro' && (
          <motion.div 
            className="text-center mb-3"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-xs text-gray-400">
              Sessions: <span className="text-white font-medium">{sessionsCompleted}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
                className="bg-green-600 hover:bg-green-700 h-7 px-3 text-xs transition-all duration-200 hover:scale-105"
                size="sm"
                aria-label="Start timer"
                tabIndex={0}
              >
                <Play className="w-3 h-3 mr-1" />
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
                className="bg-yellow-600 hover:bg-yellow-700 h-7 px-3 text-xs transition-all duration-200 hover:scale-105"
                size="sm"
                aria-label="Pause timer"
                tabIndex={0}
              >
                <Pause className="w-3 h-3 mr-1" />
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
            className="bg-overlay-light border-gray-600 text-gray-200 hover:bg-glass h-7 px-3 text-xs transition-all duration-200"
            size="sm"
            aria-label="Reset timer"
            tabIndex={0}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </motion.div>
      </div>

      <AnimatePresence>
        {mode === 'timer' && (
          <motion.div 
            className="flex justify-center gap-1 flex-wrap"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            role="group"
            aria-label="Quick timer presets"
          >
            {[5, 10, 15, 25, 30].map((mins) => (
              <motion.div
                key={mins}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={() => setTimeLeft(mins * 60)}
                  variant="outline"
                  size="sm"
                  className="bg-overlay-light border-gray-600 text-gray-300 hover:bg-glass text-xs h-6 px-2 transition-all duration-200"
                  aria-label={`Set timer to ${mins} minutes`}
                  tabIndex={0}
                >
                  {mins}m
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TimerWidget;
