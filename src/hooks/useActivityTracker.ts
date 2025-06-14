
import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface ActivityData {
  notes: {
    created: number;
    completed: number;
    averageLength: number;
    lastActivity: string;
  };
  todos: {
    total: number;
    completed: number;
    overdue: number;
    completionRate: number;
    lastActivity: string;
  };
  timer: {
    sessionsToday: number;
    totalFocusTime: number;
    streakDays: number;
    averageSessionLength: number;
    lastSession: string;
  };
  spotify: {
    tracksPlayed: number;
    currentMood: 'focus' | 'relax' | 'energetic' | 'unknown';
    lastActivity: string;
  };
  lastUpdated: string;
}

const defaultActivity: ActivityData = {
  notes: { created: 0, completed: 0, averageLength: 0, lastActivity: '' },
  todos: { total: 0, completed: 0, overdue: 0, completionRate: 0, lastActivity: '' },
  timer: { sessionsToday: 0, totalFocusTime: 0, streakDays: 0, averageSessionLength: 0, lastSession: '' },
  spotify: { tracksPlayed: 0, currentMood: 'unknown', lastActivity: '' },
  lastUpdated: new Date().toISOString()
};

export const useActivityTracker = () => {
  const [activity, setActivity] = useLocalStorage<ActivityData>('vibemind-activity', defaultActivity);
  const [dailyReset, setDailyReset] = useLocalStorage<string>('vibemind-daily-reset', '');

  // Reset daily stats if it's a new day
  useEffect(() => {
    const today = new Date().toDateString();
    if (dailyReset !== today) {
      setActivity(prev => ({
        ...prev,
        notes: { ...prev.notes, created: 0 },
        todos: { ...prev.todos, total: 0, completed: 0 },
        timer: { ...prev.timer, sessionsToday: 0, totalFocusTime: 0 },
        spotify: { ...prev.spotify, tracksPlayed: 0 },
        lastUpdated: new Date().toISOString()
      }));
      setDailyReset(today);
    }
  }, [dailyReset, setActivity, setDailyReset]);

  const trackNoteActivity = useCallback((action: 'created' | 'saved', length?: number) => {
    setActivity(prev => ({
      ...prev,
      notes: {
        ...prev.notes,
        created: action === 'created' ? prev.notes.created + 1 : prev.notes.created,
        completed: action === 'saved' ? prev.notes.completed + 1 : prev.notes.completed,
        averageLength: length ? Math.round((prev.notes.averageLength + length) / 2) : prev.notes.averageLength,
        lastActivity: new Date().toISOString()
      },
      lastUpdated: new Date().toISOString()
    }));
  }, [setActivity]);

  const trackTodoActivity = useCallback((action: 'added' | 'completed' | 'deleted', isOverdue?: boolean) => {
    setActivity(prev => {
      const newTodos = {
        ...prev.todos,
        total: action === 'added' ? prev.todos.total + 1 : 
               action === 'deleted' ? Math.max(0, prev.todos.total - 1) : prev.todos.total,
        completed: action === 'completed' ? prev.todos.completed + 1 : prev.todos.completed,
        overdue: isOverdue ? prev.todos.overdue + 1 : prev.todos.overdue,
        lastActivity: new Date().toISOString()
      };
      newTodos.completionRate = newTodos.total > 0 ? Math.round((newTodos.completed / newTodos.total) * 100) : 0;
      
      return {
        ...prev,
        todos: newTodos,
        lastUpdated: new Date().toISOString()
      };
    });
  }, [setActivity]);

  const trackTimerActivity = useCallback((action: 'started' | 'completed', duration?: number) => {
    setActivity(prev => ({
      ...prev,
      timer: {
        ...prev.timer,
        sessionsToday: action === 'completed' ? prev.timer.sessionsToday + 1 : prev.timer.sessionsToday,
        totalFocusTime: duration ? prev.timer.totalFocusTime + duration : prev.timer.totalFocusTime,
        averageSessionLength: duration && prev.timer.sessionsToday > 0 ? 
          Math.round((prev.timer.averageSessionLength + duration) / 2) : prev.timer.averageSessionLength,
        lastSession: new Date().toISOString(),
        streakDays: action === 'completed' ? prev.timer.streakDays + 1 : prev.timer.streakDays
      },
      lastUpdated: new Date().toISOString()
    }));
  }, [setActivity]);

  const trackSpotifyActivity = useCallback((action: 'played' | 'paused', mood?: 'focus' | 'relax' | 'energetic') => {
    setActivity(prev => ({
      ...prev,
      spotify: {
        ...prev.spotify,
        tracksPlayed: action === 'played' ? prev.spotify.tracksPlayed + 1 : prev.spotify.tracksPlayed,
        currentMood: mood || prev.spotify.currentMood,
        lastActivity: new Date().toISOString()
      },
      lastUpdated: new Date().toISOString()
    }));
  }, [setActivity]);

  return {
    activity,
    trackNoteActivity,
    trackTodoActivity,
    trackTimerActivity,
    trackSpotifyActivity
  };
};
