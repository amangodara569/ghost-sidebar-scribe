
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface ActivityEvent {
  id: string;
  type: 'note' | 'todo' | 'timer' | 'bookmark' | 'spotify' | 'voice';
  action: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  duration?: number;
}

export interface DailyStats {
  date: string;
  notes: { created: number; saved: number; totalWords: number };
  todos: { added: number; completed: number; deleted: number };
  timer: { sessions: number; totalMinutes: number; longestSession: number };
  bookmarks: { saved: number; domains: string[] };
  spotify: { interactions: number; timeListening: number };
  voice: { commands: number; mostUsed: string[] };
  peakHour: number;
  focusScore: number;
}

export interface WeeklyInsight {
  weekStart: string;
  totalFocusTime: number;
  completionRate: number;
  mostProductiveDay: string;
  topPatterns: string[];
  suggestions: string[];
}

class AnalyticsEngine {
  private events: ActivityEvent[] = [];
  private dailyStats: Map<string, DailyStats> = new Map();

  constructor() {
    this.loadFromStorage();
    this.setupEventListeners();
  }

  private loadFromStorage() {
    const stored = localStorage.getItem('vibemind-analytics');
    if (stored) {
      const data = JSON.parse(stored);
      this.events = data.events || [];
      this.dailyStats = new Map(data.dailyStats || []);
    }
  }

  private saveToStorage() {
    const data = {
      events: this.events.slice(-1000), // Keep last 1000 events
      dailyStats: Array.from(this.dailyStats.entries())
    };
    localStorage.setItem('vibemind-analytics', JSON.stringify(data));
  }

  private setupEventListeners() {
    // Listen for various app events
    window.addEventListener('analytics:track', this.handleEvent.bind(this));
    
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('system', document.hidden ? 'blur' : 'focus');
    });
  }

  private handleEvent(event: CustomEvent) {
    const { type, action, metadata, duration } = event.detail;
    this.trackEvent(type, action, metadata, duration);
  }

  trackEvent(type: ActivityEvent['type'], action: string, metadata?: Record<string, any>, duration?: number) {
    const event: ActivityEvent = {
      id: crypto.randomUUID(),
      type,
      action,
      timestamp: new Date(),
      metadata,
      duration
    };

    this.events.push(event);
    this.updateDailyStats(event);
    this.saveToStorage();

    // Emit for real-time updates
    window.dispatchEvent(new CustomEvent('analytics:updated', { detail: event }));
  }

  private updateDailyStats(event: ActivityEvent) {
    const dateKey = event.timestamp.toDateString();
    const stats = this.dailyStats.get(dateKey) || this.getEmptyDayStats(dateKey);

    const hour = event.timestamp.getHours();

    switch (event.type) {
      case 'note':
        if (event.action === 'created') stats.notes.created++;
        if (event.action === 'saved') {
          stats.notes.saved++;
          stats.notes.totalWords += event.metadata?.wordCount || 0;
        }
        break;

      case 'todo':
        if (event.action === 'added') stats.todos.added++;
        if (event.action === 'completed') stats.todos.completed++;
        if (event.action === 'deleted') stats.todos.deleted++;
        break;

      case 'timer':
        if (event.action === 'completed') {
          stats.timer.sessions++;
          const minutes = event.duration || 0;
          stats.timer.totalMinutes += minutes;
          stats.timer.longestSession = Math.max(stats.timer.longestSession, minutes);
        }
        break;

      case 'bookmark':
        if (event.action === 'saved') {
          stats.bookmarks.saved++;
          if (event.metadata?.domain) {
            stats.bookmarks.domains.push(event.metadata.domain);
          }
        }
        break;

      case 'spotify':
        stats.spotify.interactions++;
        if (event.duration) {
          stats.spotify.timeListening += event.duration;
        }
        break;

      case 'voice':
        stats.voice.commands++;
        if (event.metadata?.command) {
          stats.voice.mostUsed.push(event.metadata.command);
        }
        break;
    }

    // Update peak hour and focus score
    stats.peakHour = this.calculatePeakHour(dateKey);
    stats.focusScore = this.calculateFocusScore(stats);

    this.dailyStats.set(dateKey, stats);
  }

  private getEmptyDayStats(date: string): DailyStats {
    return {
      date,
      notes: { created: 0, saved: 0, totalWords: 0 },
      todos: { added: 0, completed: 0, deleted: 0 },
      timer: { sessions: 0, totalMinutes: 0, longestSession: 0 },
      bookmarks: { saved: 0, domains: [] },
      spotify: { interactions: 0, timeListening: 0 },
      voice: { commands: 0, mostUsed: [] },
      peakHour: 12,
      focusScore: 0
    };
  }

  private calculatePeakHour(date: string): number {
    const dayEvents = this.events.filter(e => e.timestamp.toDateString() === date);
    const hourCounts = new Array(24).fill(0);
    
    dayEvents.forEach(event => {
      hourCounts[event.timestamp.getHours()]++;
    });

    return hourCounts.indexOf(Math.max(...hourCounts));
  }

  private calculateFocusScore(stats: DailyStats): number {
    const timerScore = Math.min(stats.timer.totalMinutes / 120, 1) * 40; // Max 40 points for 2h focus
    const todoScore = stats.todos.completed * 10; // 10 points per completed todo
    const noteScore = Math.min(stats.notes.saved, 5) * 10; // Max 50 points for 5 notes
    
    return Math.min(Math.round(timerScore + todoScore + noteScore), 100);
  }

  getDailyStats(date?: string): DailyStats {
    const dateKey = date || new Date().toDateString();
    return this.dailyStats.get(dateKey) || this.getEmptyDayStats(dateKey);
  }

  getWeeklyStats(weekStart?: Date): DailyStats[] {
    const start = weekStart || new Date();
    start.setDate(start.getDate() - start.getDay()); // Start of week
    
    const week: DailyStats[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      week.push(this.getDailyStats(date.toDateString()));
    }
    
    return week;
  }

  getInsights(period: 'daily' | 'weekly' = 'daily'): string[] {
    const insights: string[] = [];
    
    if (period === 'daily') {
      const today = this.getDailyStats();
      
      if (today.focusScore > 80) {
        insights.push("🔥 Amazing focus today! You're in the zone.");
      }
      
      if (today.timer.totalMinutes > 120) {
        insights.push(`⏰ You focused for ${Math.round(today.timer.totalMinutes)} minutes today.`);
      }
      
      if (today.todos.completed > today.todos.added) {
        insights.push("✅ You're crushing your todo list!");
      }
      
      if (today.peakHour !== 12) {
        const timeStr = today.peakHour === 0 ? '12 AM' : 
                      today.peakHour <= 12 ? `${today.peakHour} AM` : 
                      `${today.peakHour - 12} PM`;
        insights.push(`🕐 Your peak activity time is around ${timeStr}.`);
      }
    }
    
    return insights;
  }

  exportData() {
    return {
      events: this.events,
      dailyStats: Array.from(this.dailyStats.entries()),
      exportDate: new Date().toISOString()
    };
  }
}

export const analyticsEngine = new AnalyticsEngine();

// Helper function to track events from components
export const trackActivity = (type: ActivityEvent['type'], action: string, metadata?: Record<string, any>, duration?: number) => {
  analyticsEngine.trackEvent(type, action, metadata, duration);
};
