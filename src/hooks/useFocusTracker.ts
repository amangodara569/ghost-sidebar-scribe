
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';

interface ActivitySession {
  startTime: number;
  endTime?: number;
  interactions: number;
  idleTime: number;
  timerUsage: number;
  noteActivity: number;
  todoActivity: number;
  spotifyActivity: number;
}

interface FocusData {
  score: number;
  lastActive: number;
  todaysSessions: ActivitySession[];
  isIdle: boolean;
  streakMinutes: number;
  lastCalculated: number;
}

const IDLE_THRESHOLD = 60000; // 60 seconds
const SCORE_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes
const NUDGE_IDLE_THRESHOLD = 2 * 60 * 1000; // 2 minutes
const FOCUS_STREAK_THRESHOLD = 40 * 60 * 1000; // 40 minutes

export const useFocusTracker = () => {
  const [focusData, setFocusData] = useLocalStorage<FocusData>('focus-tracker', {
    score: 100,
    lastActive: Date.now(),
    todaysSessions: [],
    isIdle: false,
    streakMinutes: 0,
    lastCalculated: Date.now()
  });

  const [isNudgesEnabled, setIsNudgesEnabled] = useLocalStorage('focus-nudges-enabled', true);
  const [currentSession, setCurrentSession] = useState<ActivitySession>({
    startTime: Date.now(),
    interactions: 0,
    idleTime: 0,
    timerUsage: 0,
    noteActivity: 0,
    todoActivity: 0,
    spotifyActivity: 0
  });

  const lastInteractionRef = useRef(Date.now());
  const idleCheckRef = useRef<NodeJS.Timeout>();
  const scoreUpdateRef = useRef<NodeJS.Timeout>();
  const lastNudgeTimeRef = useRef(0);
  const activityListenersRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number>();

  // Calculate focus score based on various factors
  const calculateFocusScore = useCallback((session: ActivitySession, previousScore: number): number => {
    const sessionDuration = (session.endTime || Date.now()) - session.startTime;
    const activeRatio = Math.max(0, (sessionDuration - session.idleTime) / sessionDuration);
    
    // Base score from activity ratio (0-40 points)
    const activityScore = activeRatio * 40;
    
    // Timer usage bonus (0-20 points)
    const timerScore = Math.min(session.timerUsage / 30, 1) * 20; // 30 min = max points
    
    // Productivity bonus from notes/todos (0-20 points)
    const productivityScore = Math.min((session.noteActivity + session.todoActivity) / 10, 1) * 20;
    
    // Interaction consistency (0-20 points)
    const interactionScore = Math.min(session.interactions / 100, 1) * 20;
    
    const newScore = Math.round(activityScore + timerScore + productivityScore + interactionScore);
    
    // Smooth transition with previous score
    return Math.round((previousScore * 0.3) + (newScore * 0.7));
  }, []);

  // Track user interactions with throttling
  const trackInteraction = useCallback(() => {
    const now = Date.now();
    
    // Throttle to prevent excessive updates
    if (now - lastInteractionRef.current < 1000) return;
    
    lastInteractionRef.current = now;

    setCurrentSession(prev => ({
      ...prev,
      interactions: prev.interactions + 1
    }));

    setFocusData(prev => ({
      ...prev,
      lastActive: now,
      isIdle: false
    }));

    // Clear existing idle check
    if (idleCheckRef.current) {
      clearTimeout(idleCheckRef.current);
    }

    // Set new idle check
    idleCheckRef.current = setTimeout(() => {
      setFocusData(prev => ({ ...prev, isIdle: true }));
      
      // Show idle nudge if enabled
      if (isNudgesEnabled && now - lastNudgeTimeRef.current > 10 * 60 * 1000) { // 10 min cooldown
        toast("👀 You've been idle for 2 minutes — take a 5-minute walk?", {
          duration: 5000,
        });
        lastNudgeTimeRef.current = now;
      }
    }, IDLE_THRESHOLD);
  }, [setFocusData, isNudgesEnabled]);

  // Track specific activities
  const trackFocusActivity = useCallback((type: 'timer' | 'note' | 'todo' | 'spotify', value: number = 1) => {
    setCurrentSession(prev => ({
      ...prev,
      [`${type}Activity`]: prev[`${type}Activity` as keyof ActivitySession] + value
    }));
    trackInteraction();
  }, [trackInteraction]);

  // Track visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      setFocusData(prev => ({ ...prev, isIdle: true }));
    } else {
      trackInteraction();
    }
  }, [trackInteraction]);

  // Update focus score periodically - memoized to prevent infinite loops
  const updateFocusScore = useCallback(() => {
    const now = Date.now();
    const sessionWithEndTime = { ...currentSession, endTime: now };
    const newScore = calculateFocusScore(sessionWithEndTime, focusData.score);
    
    // Check for focus streak
    const streakDuration = now - currentSession.startTime;
    if (streakDuration >= FOCUS_STREAK_THRESHOLD && isNudgesEnabled) {
      const streakMinutes = Math.floor(streakDuration / (60 * 1000));
      if (streakMinutes > focusData.streakMinutes) {
        toast("🧠 Great focus streak! You've been active for " + streakMinutes + " minutes.", {
          duration: 4000,
        });
        setFocusData(prev => ({ ...prev, streakMinutes }));
      }
    }

    setFocusData(prev => ({
      ...prev,
      score: newScore,
      lastCalculated: now,
      todaysSessions: [...prev.todaysSessions.slice(-9), sessionWithEndTime] // Keep last 10 sessions
    }));

    // Start new session
    setCurrentSession({
      startTime: now,
      interactions: 0,
      idleTime: 0,
      timerUsage: 0,
      noteActivity: 0,
      todoActivity: 0,
      spotifyActivity: 0
    });
  }, [currentSession, focusData.score, focusData.streakMinutes, calculateFocusScore, isNudgesEnabled, setFocusData]);

  // Listen for activity events from other widgets
  useEffect(() => {
    const handleActivityEvent = (event: CustomEvent) => {
      const { type, value } = event.detail;
      trackFocusActivity(type, value);
    };

    window.addEventListener('focus:activity', handleActivityEvent as EventListener);
    
    return () => {
      window.removeEventListener('focus:activity', handleActivityEvent as EventListener);
    };
  }, [trackFocusActivity]);

  // Setup activity listeners with proper cleanup
  useEffect(() => {
    if (activityListenersRef.current) return;

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    
    const throttledTrackInteraction = () => {
      if (animationFrameRef.current) return;
      animationFrameRef.current = requestAnimationFrame(() => {
        trackInteraction();
        animationFrameRef.current = undefined;
      });
    };

    events.forEach(event => {
      document.addEventListener(event, throttledTrackInteraction, { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Setup periodic score updates - only once
    scoreUpdateRef.current = setInterval(updateFocusScore, SCORE_UPDATE_INTERVAL);

    activityListenersRef.current = true;

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledTrackInteraction);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (idleCheckRef.current) clearTimeout(idleCheckRef.current);
      if (scoreUpdateRef.current) clearInterval(scoreUpdateRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      
      activityListenersRef.current = false;
    };
  }, [trackInteraction, handleVisibilityChange, updateFocusScore]);

  // Reset daily data
  useEffect(() => {
    const now = new Date();
    const lastUpdate = new Date(focusData.lastCalculated);
    
    if (now.toDateString() !== lastUpdate.toDateString()) {
      setFocusData(prev => ({
        ...prev,
        todaysSessions: [],
        streakMinutes: 0,
        score: 100
      }));
    }
  }, [focusData.lastCalculated, setFocusData]);

  const getFocusReport = useCallback(() => {
    const totalSessions = focusData.todaysSessions.length;
    const totalActiveTime = focusData.todaysSessions.reduce((acc, session) => {
      const duration = (session.endTime || Date.now()) - session.startTime;
      return acc + Math.max(0, duration - session.idleTime);
    }, 0);
    
    const averageScore = totalSessions > 0 
      ? focusData.todaysSessions.reduce((acc, session, _, arr) => {
          return acc + calculateFocusScore(session, 100) / arr.length;
        }, 0)
      : focusData.score;

    return {
      currentScore: focusData.score,
      averageScore: Math.round(averageScore),
      totalActiveTime: Math.round(totalActiveTime / (60 * 1000)), // in minutes
      sessionsToday: totalSessions,
      streakMinutes: focusData.streakMinutes,
      isIdle: focusData.isIdle,
      lastActive: focusData.lastActive
    };
  }, [focusData, calculateFocusScore]);

  return {
    focusData,
    trackFocusActivity,
    getFocusReport,
    isNudgesEnabled,
    setIsNudgesEnabled,
    currentSession
  };
};
