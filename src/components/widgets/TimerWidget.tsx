
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

  useEffect(() => {
    // Listen for timer updates from main process
    if (window.electronAPI) {
      const handleTimerUpdate = (data: any) => {
        setTimeLeft(data.timeLeft);
        setIsRunning(data.isRunning);
        setCurrentSession(data.currentSession);
        setSessionsCompleted(data.sessionsCompleted);
      };

      window.electronAPI.on('timer:update', handleTimerUpdate);
      
      // Load initial timer state
      loadTimerState();

      return () => {
        window.electronAPI.removeListener('timer:update', handleTimerUpdate);
      };
    }
  }, []);

  const loadTimerState = async () => {
    try {
      if (window.electronAPI) {
        const state = await window.electronAPI.invoke('timer:getState');
        if (state) {
          setTimeLeft(state.timeLeft);
          setIsRunning(state.isRunning);
          setCurrentSession(state.currentSession);
          setSessionsCompleted(state.sessionsCompleted);
        }
      }
    } catch (error) {
      console.error('Failed to load timer state:', error);
    }
  };

  const handleStart = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('timer:start', {
          duration: timeLeft,
          type: currentSession,
          mode
        });
        setIsRunning(true);
      }
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const handlePause = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('timer:pause');
        setIsRunning(false);
      }
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  };

  const handleReset = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('timer:reset');
        setIsRunning(false);
        setTimeLeft(currentSession === 'work' ? WORK_DURATION : BREAK_DURATION);
      }
    } catch (error) {
      console.error('Failed to reset timer:', error);
    }
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
    <Card className="bg-transparent border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-gray-100">Timer</CardTitle>
          <div className="flex gap-1">
            {['pomodoro', 'timer', 'stopwatch'].map((m) => (
              <Button
                key={m}
                size="sm"
                variant={mode === m ? "default" : "outline"}
                onClick={() => handleModeChange(m as any)}
                className={`text-xs ${mode === m ? 'bg-blue-600' : 'bg-gray-700 border-gray-600 text-gray-300'}`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-4xl font-mono font-bold ${getSessionColor()}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {getSessionLabel()}
          </div>
        </div>

        {mode === 'pomodoro' && (
          <div className="text-center">
            <div className="text-sm text-gray-400">
              Sessions Completed: <span className="text-white font-medium">{sessionsCompleted}</span>
            </div>
          </div>
        )}

        <div className="flex justify-center gap-2">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              className="bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <Play className="w-4 h-4 mr-1" />
              Start
            </Button>
          ) : (
            <Button
              onClick={handlePause}
              className="bg-yellow-600 hover:bg-yellow-700"
              size="sm"
            >
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
          )}
          
          <Button
            onClick={handleReset}
            variant="outline"
            className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
            size="sm"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>

        {mode === 'timer' && (
          <div className="flex justify-center gap-2">
            {[5, 10, 15, 25, 30].map((mins) => (
              <Button
                key={mins}
                onClick={() => setTimeLeft(mins * 60)}
                variant="outline"
                size="sm"
                className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 text-xs"
              >
                {mins}m
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TimerWidget;
