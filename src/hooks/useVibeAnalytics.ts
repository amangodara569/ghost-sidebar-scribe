
import { useState, useEffect } from 'react';
import { analyticsEngine, DailyStats } from '@/services/analyticsEngine';
import { insightsEngine, VibeSummary, Pattern } from '@/services/insightsEngine';

export const useVibeAnalytics = () => {
  const [todayStats, setTodayStats] = useState<DailyStats>(() => analyticsEngine.getDailyStats());
  const [weekStats, setWeekStats] = useState<DailyStats[]>(() => analyticsEngine.getWeeklyStats());
  const [dailySummary, setDailySummary] = useState<VibeSummary>(() => insightsEngine.generateDailySummary());
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const handleAnalyticsUpdate = () => {
      setTodayStats(analyticsEngine.getDailyStats());
      setWeekStats(analyticsEngine.getWeeklyStats());
      setDailySummary(insightsEngine.generateDailySummary());
      setLastUpdated(new Date());
    };

    window.addEventListener('analytics:updated', handleAnalyticsUpdate);
    
    // Refresh every minute to update time-based insights
    const interval = setInterval(handleAnalyticsUpdate, 60000);

    return () => {
      window.removeEventListener('analytics:updated', handleAnalyticsUpdate);
      clearInterval(interval);
    };
  }, []);

  const trackActivity = (type: 'note' | 'todo' | 'timer' | 'bookmark' | 'spotify' | 'voice', action: string, metadata?: Record<string, any>, duration?: number) => {
    analyticsEngine.trackEvent(type, action, metadata, duration);
  };

  const getInsights = (period: 'daily' | 'weekly' = 'daily') => {
    return analyticsEngine.getInsights(period);
  };

  const exportData = () => {
    return analyticsEngine.exportData();
  };

  return {
    todayStats,
    weekStats,
    dailySummary,
    lastUpdated,
    trackActivity,
    getInsights,
    exportData
  };
};
