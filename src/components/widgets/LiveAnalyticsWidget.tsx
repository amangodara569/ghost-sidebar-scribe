
import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, TrendingUp, Target, Bell, Eye, Coffee } from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

interface FocusStats {
  totalFocusTime: number;
  totalDistractionTime: number;
  totalIdleTime: number;
  sessionSwitches: number;
  longestFocusSession: number;
  topApps: Array<{
    name: string;
    time: number;
    category: string;
  }>;
  hourlyBreakdown: Array<{
    hour: number;
    focus: number;
    distraction: number;
  }>;
}

interface Recommendation {
  id: string;
  type: 'praise' | 'suggestion' | 'warning';
  message: string;
  timestamp: string;
}

interface CurrentSession {
  appName: string;
  windowTitle: string;
  category: string;
  startTime: string;
  duration: number;
}

const COLORS = {
  work: '#10b981',
  entertainment: '#f59e0b',
  tools: '#3b82f6',
  idle: '#6b7280',
  unknown: '#8b5cf6'
};

const LiveAnalyticsWidget: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  const [stats, setStats] = useState<FocusStats>({
    totalFocusTime: 0,
    totalDistractionTime: 0,
    totalIdleTime: 0,
    sessionSwitches: 0,
    longestFocusSession: 0,
    topApps: [],
    hourlyBreakdown: []
  });
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTodaysStats();
    loadCurrentSession();
    loadRecommendations();

    // Set up real-time updates
    const statsInterval = setInterval(loadTodaysStats, 60000); // Every minute
    const sessionInterval = setInterval(loadCurrentSession, 5000); // Every 5 seconds
    const recommendationInterval = setInterval(loadRecommendations, 300000); // Every 5 minutes

    // Listen for real-time updates
    if (window.electronAPI) {
      window.electronAPI.on('focus:sessionUpdate', handleSessionUpdate);
      window.electronAPI.on('focus:newRecommendation', handleNewRecommendation);
    }

    return () => {
      clearInterval(statsInterval);
      clearInterval(sessionInterval);
      clearInterval(recommendationInterval);
      if (window.electronAPI) {
        window.electronAPI.removeListener('focus:sessionUpdate', handleSessionUpdate);
        window.electronAPI.removeListener('focus:newRecommendation', handleNewRecommendation);
      }
    };
  }, []);

  const loadTodaysStats = async () => {
    try {
      if (window.electronAPI) {
        const todaysStats = await window.electronAPI.invoke('focus:getStatsToday');
        setStats(todaysStats);
      }
    } catch (error) {
      console.error('Failed to load focus stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentSession = async () => {
    try {
      if (window.electronAPI) {
        const session = await window.electronAPI.invoke('focus:getCurrentSession');
        setCurrentSession(session);
      }
    } catch (error) {
      console.error('Failed to load current session:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      if (window.electronAPI) {
        const recs = await window.electronAPI.invoke('recommendations:getLatest');
        setRecommendations(recs);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const handleSessionUpdate = (session: CurrentSession) => {
    setCurrentSession(session);
    loadTodaysStats(); // Refresh stats when session updates
  };

  const handleNewRecommendation = (recommendation: Recommendation) => {
    setRecommendations(prev => [recommendation, ...prev.slice(0, 4)]);
    
    // Show toast notification
    const icon = recommendation.type === 'praise' ? '🎉' : 
                 recommendation.type === 'suggestion' ? '💡' : '⚠️';
    
    toast(recommendation.message, {
      icon,
      duration: 5000,
    });
  };

  const formatDuration = (seconds: number) => {
    const dur = dayjs.duration(seconds, 'seconds');
    const hours = Math.floor(dur.asHours());
    const minutes = dur.minutes();
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'work': return <Target className="w-4 h-4" />;
      case 'entertainment': return <Coffee className="w-4 h-4" />;
      case 'tools': return <TrendingUp className="w-4 h-4" />;
      case 'idle': return <Clock className="w-4 h-4" />;
      default: return <Eye className="w-4 h-4" />;
    }
  };

  const pieData = [
    { name: 'Focus', value: stats.totalFocusTime, color: COLORS.work },
    { name: 'Distraction', value: stats.totalDistractionTime, color: COLORS.entertainment },
    { name: 'Idle', value: stats.totalIdleTime, color: COLORS.idle }
  ].filter(item => item.value > 0);

  const productivityScore = Math.round(
    (stats.totalFocusTime / (stats.totalFocusTime + stats.totalDistractionTime + stats.totalIdleTime)) * 100
  ) || 0;

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded mb-4"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Live Analytics</h3>
        <div className="ml-auto text-sm text-gray-400">
          Today • {dayjs().format('MMM D')}
        </div>
      </div>

      {/* Current Session */}
      {currentSession && (
        <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            {getCategoryIcon(currentSession.category)}
            <span className="text-sm font-medium text-white">Current Session</span>
            <div className="ml-auto text-xs text-gray-400">
              {formatDuration(currentSession.duration)}
            </div>
          </div>
          <div className="text-sm text-gray-300 truncate">
            {currentSession.appName}
          </div>
          {currentSession.windowTitle !== currentSession.appName && (
            <div className="text-xs text-gray-400 truncate">
              {currentSession.windowTitle}
            </div>
          )}
        </div>
      )}

      {/* Productivity Score */}
      <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">Productivity Score</span>
          <span className={`text-lg font-bold ${
            productivityScore >= 70 ? 'text-green-400' :
            productivityScore >= 50 ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {productivityScore}%
          </span>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              productivityScore >= 70 ? 'bg-green-400' :
              productivityScore >= 50 ? 'bg-yellow-400' : 'bg-red-400'
            }`}
            style={{ width: `${productivityScore}%` }}
          ></div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-700/50 rounded-lg p-3 text-center border border-gray-600">
          <div className="text-lg font-bold text-white">
            {formatDuration(stats.longestFocusSession)}
          </div>
          <div className="text-xs text-gray-400">Longest Focus</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3 text-center border border-gray-600">
          <div className="text-lg font-bold text-white">{stats.sessionSwitches}</div>
          <div className="text-xs text-gray-400">App Switches</div>
        </div>
        <div className="bg-gray-700/50 rounded-lg p-3 text-center border border-gray-600">
          <div className="text-lg font-bold text-white">
            {formatDuration(stats.totalFocusTime + stats.totalDistractionTime)}
          </div>
          <div className="text-xs text-gray-400">Active Time</div>
        </div>
      </div>

      {/* Time Distribution Chart */}
      {pieData.length > 0 && (
        <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
          <h4 className="text-sm font-medium text-white mb-3">Time Distribution</h4>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={20}
                outerRadius={40}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatDuration(value), 'Time']}
                contentStyle={{
                  backgroundColor: '#374151',
                  border: '1px solid #4B5563',
                  borderRadius: '6px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Apps */}
      {stats.topApps.length > 0 && (
        <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
          <h4 className="text-sm font-medium text-white mb-3">Top Apps Today</h4>
          <div className="space-y-2">
            {stats.topApps.slice(0, 3).map((app, index) => (
              <div key={index} className="flex items-center gap-2">
                {getCategoryIcon(app.category)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{app.name}</div>
                </div>
                <div className="text-xs text-gray-400">
                  {formatDuration(app.time)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Recommendations */}
      {recommendations.length > 0 && (
        <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-yellow-400" />
            <h4 className="text-sm font-medium text-white">Insights</h4>
          </div>
          <div className="space-y-2">
            {recommendations.slice(0, 2).map((rec) => (
              <div key={rec.id} className={`text-xs p-2 rounded border-l-2 ${
                rec.type === 'praise' ? 'bg-green-900/20 border-green-400 text-green-300' :
                rec.type === 'suggestion' ? 'bg-blue-900/20 border-blue-400 text-blue-300' :
                'bg-yellow-900/20 border-yellow-400 text-yellow-300'
              }`}>
                {rec.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveAnalyticsWidget;
