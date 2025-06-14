import { useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SecureStorage } from '@/utils/security';

interface UsageEvent {
  id: string;
  type: 'focus_session' | 'spotify_change' | 'sidebar_time' | 'widget_usage' | 'goal_completion';
  timestamp: string;
  duration?: number;
  metadata?: Record<string, any>;
  sessionId: string;
}

interface UsageStats {
  totalFocusTime: number;
  sessionsCompleted: number;
  mostProductiveHour: number;
  favoriteWidgets: Record<string, number>;
  weeklyGoals: number;
  streak: number;
}

export const useUsageAnalytics = () => {
  const [events, setEvents] = useLocalStorage<UsageEvent[]>('vibemind-analytics-events', []);
  const [stats, setStats] = useLocalStorage<UsageStats>('vibemind-analytics-stats', {
    totalFocusTime: 0,
    sessionsCompleted: 0,
    mostProductiveHour: 9,
    favoriteWidgets: {},
    weeklyGoals: 0,
    streak: 0
  });

  const trackEvent = useCallback(async (
    type: UsageEvent['type'], 
    metadata?: Record<string, any>, 
    duration?: number
  ) => {
    const event: UsageEvent = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      duration,
      metadata,
      sessionId: await getSessionId()
    };

    // Store event
    setEvents(prev => {
      const updated = [...prev, event];
      // Keep only last 1000 events
      return updated.slice(-1000);
    });

    // Update stats
    updateStats(event);

    // In production, optionally send to analytics service
    if (shouldSendToService()) {
      sendToAnalyticsService(event);
    }
  }, [events, setEvents]);

  const updateStats = (event: UsageEvent) => {
    setStats(prev => {
      const updated = { ...prev };

      switch (event.type) {
        case 'focus_session':
          if (event.duration) {
            updated.totalFocusTime += event.duration;
            updated.sessionsCompleted += 1;
          }
          break;
        
        case 'widget_usage':
          if (event.metadata?.widgetType) {
            const widget = event.metadata.widgetType;
            updated.favoriteWidgets[widget] = (updated.favoriteWidgets[widget] || 0) + 1;
          }
          break;
        
        case 'goal_completion':
          updated.weeklyGoals += 1;
          break;
      }

      return updated;
    });
  };

  const getInsights = useCallback(() => {
    const recentEvents = events.filter(event => 
      new Date(event.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    const focusSessions = recentEvents.filter(e => e.type === 'focus_session');
    const avgSessionLength = focusSessions.length > 0 
      ? focusSessions.reduce((sum, session) => sum + (session.duration || 0), 0) / focusSessions.length
      : 0;

    const hourlyActivity = new Array(24).fill(0);
    recentEvents.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      hourlyActivity[hour]++;
    });

    const mostActiveHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));

    return {
      weeklyStats: {
        totalSessions: focusSessions.length,
        totalFocusTime: focusSessions.reduce((sum, s) => sum + (s.duration || 0), 0),
        averageSessionLength: Math.round(avgSessionLength),
        mostActiveHour
      },
      trends: {
        isImproving: focusSessions.length > stats.sessionsCompleted / 4, // Rough comparison
        streakDays: calculateStreak(events),
        topWidget: Object.entries(stats.favoriteWidgets).sort(([,a], [,b]) => b - a)[0]?.[0] || 'none'
      }
    };
  }, [events, stats]);

  const exportData = useCallback(() => {
    return {
      events: events.map(event => ({
        ...event,
        // Remove sensitive metadata for export
        metadata: event.metadata ? Object.keys(event.metadata).reduce((acc, key) => {
          if (!key.includes('token') && !key.includes('password')) {
            acc[key] = event.metadata![key];
          }
          return acc;
        }, {} as Record<string, any>) : undefined
      })),
      stats,
      exportedAt: new Date().toISOString()
    };
  }, [events, stats]);

  return {
    trackEvent,
    stats,
    getInsights,
    exportData,
    events: events.slice(-100) // Return only recent events for UI
  };
};

// Helper functions
async function getSessionId(): Promise<string> {
  const stored = await SecureStorage.getSecureItem('session-id', null);
  if (stored) return stored;
  
  const newSessionId = crypto.randomUUID();
  await SecureStorage.setSecureItem('session-id', newSessionId);
  return newSessionId;
}

function shouldSendToService(): boolean {
  // In production, check user preferences and privacy settings
  return false;
}

async function sendToAnalyticsService(event: UsageEvent) {
  // In production, send to your analytics endpoint
  // This could be PostHog, Mixpanel, or custom solution
  console.log('Would send to analytics service:', event);
}

function calculateStreak(events: UsageEvent[]): number {
  const focusEvents = events.filter(e => e.type === 'focus_session');
  if (focusEvents.length === 0) return 0;

  const days = new Set();
  focusEvents.forEach(event => {
    const day = new Date(event.timestamp).toDateString();
    days.add(day);
  });

  // Simple streak calculation - count consecutive days with activity
  const sortedDays = Array.from(days).sort();
  let streak = 1;
  
  for (let i = sortedDays.length - 2; i >= 0; i--) {
    const current = new Date(sortedDays[i + 1]);
    const previous = new Date(sortedDays[i]);
    const diffDays = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}
