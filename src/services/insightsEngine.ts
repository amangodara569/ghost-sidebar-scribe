
import { analyticsEngine, DailyStats, WeeklyInsight } from './analyticsEngine';

export interface Pattern {
  type: 'time' | 'behavior' | 'productivity' | 'music';
  title: string;
  description: string;
  confidence: number;
  suggestion?: string;
}

export interface VibeSummary {
  date: string;
  mood: 'productive' | 'relaxed' | 'busy' | 'balanced';
  keyStats: string[];
  patterns: Pattern[];
  score: number;
  quote: string;
}

class InsightsEngine {
  generateDailySummary(date?: string): VibeSummary {
    const stats = analyticsEngine.getDailyStats(date);
    const patterns = this.detectDailyPatterns(stats);
    
    return {
      date: stats.date,
      mood: this.determineMood(stats),
      keyStats: this.getKeyStats(stats),
      patterns,
      score: stats.focusScore,
      quote: this.generateQuote(stats)
    };
  }

  generateWeeklySummary(): WeeklyInsight {
    const weekStats = analyticsEngine.getWeeklyStats();
    const totalFocus = weekStats.reduce((sum, day) => sum + day.timer.totalMinutes, 0);
    const totalTodos = weekStats.reduce((sum, day) => sum + day.todos.added, 0);
    const completedTodos = weekStats.reduce((sum, day) => sum + day.todos.completed, 0);
    
    const mostProductiveDay = weekStats.reduce((max, day) => 
      day.focusScore > max.focusScore ? day : max
    );

    return {
      weekStart: weekStats[0].date,
      totalFocusTime: totalFocus,
      completionRate: totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0,
      mostProductiveDay: mostProductiveDay.date,
      topPatterns: this.detectWeeklyPatterns(weekStats),
      suggestions: this.generateWeeklySuggestions(weekStats)
    };
  }

  private detectDailyPatterns(stats: DailyStats): Pattern[] {
    const patterns: Pattern[] = [];

    // Time pattern
    if (stats.peakHour >= 9 && stats.peakHour <= 11) {
      patterns.push({
        type: 'time',
        title: 'Morning Warrior',
        description: `You're most active around ${this.formatHour(stats.peakHour)}`,
        confidence: 0.8,
        suggestion: 'Schedule important tasks in the morning for best results'
      });
    }

    // Productivity pattern
    if (stats.timer.sessions >= 3) {
      patterns.push({
        type: 'productivity',
        title: 'Focus Champion',
        description: `${stats.timer.sessions} focus sessions today`,
        confidence: 0.9,
        suggestion: 'Keep this momentum going tomorrow!'
      });
    }

    // Note-taking pattern
    if (stats.notes.created > stats.notes.saved * 0.5) {
      patterns.push({
        type: 'behavior',
        title: 'Idea Generator',
        description: 'You create more notes than you finish',
        confidence: 0.7,
        suggestion: 'Try setting a daily goal to complete 2-3 notes'
      });
    }

    return patterns;
  }

  private detectWeeklyPatterns(weekStats: DailyStats[]): string[] {
    const patterns: string[] = [];
    
    const avgFocus = weekStats.reduce((sum, day) => sum + day.timer.totalMinutes, 0) / 7;
    if (avgFocus > 60) {
      patterns.push(`Averaging ${Math.round(avgFocus)} minutes of focus per day`);
    }

    const bestDay = weekStats.reduce((max, day) => day.focusScore > max.focusScore ? day : max);
    patterns.push(`Best day: ${this.getDayName(bestDay.date)} with ${bestDay.focusScore}% focus score`);

    return patterns;
  }

  private generateWeeklySuggestions(weekStats: DailyStats[]): string[] {
    const suggestions: string[] = [];
    
    const lowFocusDays = weekStats.filter(day => day.timer.totalMinutes < 30).length;
    if (lowFocusDays > 3) {
      suggestions.push('Try setting a minimum daily focus goal of 30 minutes');
    }

    const totalBookmarks = weekStats.reduce((sum, day) => sum + day.bookmarks.saved, 0);
    if (totalBookmarks > 10) {
      suggestions.push('You saved a lot of links this week - time to organize them!');
    }

    return suggestions;
  }

  private determineMood(stats: DailyStats): VibeSummary['mood'] {
    if (stats.timer.totalMinutes > 120 && stats.todos.completed >= 3) {
      return 'productive';
    } else if (stats.spotify.timeListening > 180 && stats.timer.sessions < 2) {
      return 'relaxed';
    } else if (stats.voice.commands > 10 || stats.bookmarks.saved > 5) {
      return 'busy';
    } else {
      return 'balanced';
    }
  }

  private getKeyStats(stats: DailyStats): string[] {
    const keyStats: string[] = [];
    
    if (stats.timer.totalMinutes > 0) {
      keyStats.push(`${Math.round(stats.timer.totalMinutes)} minutes focused`);
    }
    
    if (stats.todos.completed > 0) {
      keyStats.push(`${stats.todos.completed} todos completed`);
    }
    
    if (stats.notes.saved > 0) {
      keyStats.push(`${stats.notes.saved} notes saved`);
    }

    return keyStats.slice(0, 3);
  }

  private generateQuote(stats: DailyStats): string {
    const quotes = {
      productive: [
        "Productivity is never an accident. It's the result of commitment to excellence.",
        "The way to get started is to quit talking and begin doing.",
        "Focus on being productive instead of busy."
      ],
      relaxed: [
        "Sometimes the most productive thing you can do is relax.",
        "Rest when you're weary. Refresh and renew yourself.",
        "Balance is the key to everything."
      ],
      busy: [
        "Busy is a choice. Stress is a choice. Joy is a choice. Choose well.",
        "It's not about having time. It's about making time.",
        "Don't mistake movement for achievement."
      ],
      balanced: [
        "Life is like riding a bicycle. To keep your balance, you must keep moving.",
        "Balance is not something you find, it's something you create.",
        "Work-life balance is not a destination, but a journey."
      ]
    };

    const mood = this.determineMood(stats);
    const moodQuotes = quotes[mood];
    return moodQuotes[Math.floor(Math.random() * moodQuotes.length)];
  }

  private formatHour(hour: number): string {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  }

  private getDayName(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }
}

export const insightsEngine = new InsightsEngine();
