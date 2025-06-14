import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, Square, RotateCcw } from 'lucide-react';

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

  // Timer logic using setInterval since we're in a web environment
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft]);

  const handleSessionComplete = () => {
    // Play notification sound or show toast
    console.log('Timer completed!');
    
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
    console.log('Timer started:', { mode, timeLeft, currentSession });
  };

  const handlePause = () => {
    setIsRunning(false);
    console.log('Timer paused');
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(currentSession === 'work' ? WORK_DURATION : BREAK_DURATION);
    console.log('Timer reset');
  };

  const handleModeChange = (newMode: 'pomodoro' | 'timer' | 'stopwatch') => {
    setMode(newMode);
    if (newMode === 'pomodoro') {
      setTimeLeft(WORK_DURATION);
      setCurrentSession('work');
    } else if (newMode === 'timer') {
      setTimeLeft(25 * 60);
    } else {
      setTimeLeft(0);
    }
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
    <div className="bg-transparent border-none p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-200">Timer</h3>
        <div className="flex gap-1">
          {['pomodoro', 'timer', 'stopwatch'].map((m) => (
            <Button
              key={m}
              size="sm"
              variant={mode === m ? "default" : "outline"}
              onClick={() => handleModeChange(m as any)}
              className={`text-xs h-6 px-2 ${mode === m ? 'bg-purple-600 text-white' : 'bg-overlay-light border-gray-600 text-gray-300'}`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="text-center mb-3">
        <div className={`text-2xl font-mono font-bold ${getSessionColor()}`}>
          {formatTime(timeLeft)}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {getSessionLabel()}
        </div>
      </div>

      {mode === 'pomodoro' && (
        <div className="text-center mb-3">
          <div className="text-xs text-gray-400">
            Sessions: <span className="text-white font-medium">{sessionsCompleted}</span>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-2 mb-3">
        {!isRunning ? (
          <Button
            onClick={handleStart}
            className="bg-green-600 hover:bg-green-700 h-7 px-3 text-xs"
            size="sm"
          >
            <Play className="w-3 h-3 mr-1" />
            Start
          </Button>
        ) : (
          <Button
            onClick={handlePause}
            className="bg-yellow-600 hover:bg-yellow-700 h-7 px-3 text-xs"
            size="sm"
          >
            <Pause className="w-3 h-3 mr-1" />
            Pause
          </Button>
        )}
        
        <Button
          onClick={handleReset}
          className="bg-overlay-light border-gray-600 text-gray-200 hover:bg-glass h-7 px-3 text-xs"
          size="sm"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reset
        </Button>
      </div>

      {mode === 'timer' && (
        <div className="flex justify-center gap-1 flex-wrap">
          {[5, 10, 15, 25, 30].map((mins) => (
            <Button
              key={mins}
              onClick={() => setTimeLeft(mins * 60)}
              variant="outline"
              size="sm"
              className="bg-overlay-light border-gray-600 text-gray-300 hover:bg-glass text-xs h-6 px-2"
            >
              {mins}m
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimerWidget;
