
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

export interface Suggestion {
  id: string;
  type: 'tip' | 'reminder' | 'action' | 'celebration';
  title: string;
  message: string;
  action?: {
    label: string;
    command: string;
  };
  priority: 'low' | 'medium' | 'high';
  icon: string;
  dismissible: boolean;
}

export class SuggestionEngine {
  private lastSuggestionTime: number = 0;
  private readonly cooldownMs = 5 * 60 * 1000; // 5 minutes between suggestions

  generateSuggestions(activity: ActivityData): Suggestion[] {
    const now = Date.now();
    if (now - this.lastSuggestionTime < this.cooldownMs) {
      return [];
    }

    const suggestions: Suggestion[] = [];
    const currentHour = new Date().getHours();

    // Note-taking patterns
    if (activity.notes.created > 3 && activity.notes.completed === 0) {
      suggestions.push({
        id: 'notes-unfinished',
        type: 'tip',
        title: 'Unfinished Notes',
        message: `You've started ${activity.notes.created} notes today but haven't saved any. Want to organize them?`,
        action: { label: 'Open Notes', command: 'focus-notes' },
        priority: 'medium',
        icon: '📝',
        dismissible: true
      });
    }

    // Todo completion patterns
    if (activity.todos.total > 0 && activity.todos.completionRate < 30) {
      suggestions.push({
        id: 'low-todo-completion',
        type: 'tip',
        title: 'Todo Productivity',
        message: `Your completion rate is ${activity.todos.completionRate}%. Try breaking tasks into smaller pieces!`,
        action: { label: 'Review Todos', command: 'focus-todos' },
        priority: 'medium',
        icon: '✅',
        dismissible: true
      });
    }

    // Timer patterns & celebrations
    if (activity.timer.sessionsToday >= 3) {
      suggestions.push({
        id: 'timer-streak',
        type: 'celebration',
        title: 'Focus Streak! 🔥',
        message: `${activity.timer.sessionsToday} focus sessions today! You're on fire!`,
        priority: 'low',
        icon: '🎉',
        dismissible: true
      });
    }

    // Break reminders
    if (activity.timer.totalFocusTime > 120 && currentHour > 10 && currentHour < 18) {
      const lastSession = new Date(activity.timer.lastSession);
      const timeSinceBreak = now - lastSession.getTime();
      if (timeSinceBreak > 30 * 60 * 1000) { // 30 minutes since last session
        suggestions.push({
          id: 'break-reminder',
          type: 'reminder',
          title: 'Break Time',
          message: 'You\'ve been focused for a while. Time for a 5-minute break?',
          action: { label: 'Start Break Timer', command: 'start-break-timer' },
          priority: 'high',
          icon: '☕',
          dismissible: true
        });
      }
    }

    // Music & mood suggestions
    if (activity.spotify.currentMood === 'focus' && activity.timer.sessionsToday === 0) {
      suggestions.push({
        id: 'focus-music-timer',
        type: 'action',
        title: 'Focus Mode Ready',
        message: 'You\'re listening to focus music. Ready to start a timer session?',
        action: { label: 'Start 25min Timer', command: 'start-pomodoro' },
        priority: 'medium',
        icon: '⏰',
        dismissible: true
      });
    }

    // End of day summary
    if (currentHour >= 17 && currentHour <= 19 && activity.todos.total > 0) {
      suggestions.push({
        id: 'day-summary',
        type: 'tip',
        title: 'Day Summary',
        message: `Today: ${activity.todos.completed}/${activity.todos.total} todos, ${activity.timer.sessionsToday} focus sessions. Good work!`,
        priority: 'low',
        icon: '📊',
        dismissible: true
      });
    }

    if (suggestions.length > 0) {
      this.lastSuggestionTime = now;
    }

    return suggestions.slice(0, 2); // Max 2 suggestions at once
  }

  // Get contextual tips based on current activity
  getContextualTips(currentWidget: string): string[] {
    const tips: Record<string, string[]> = {
      notes: [
        "💡 Use bullet points for better structure",
        "🏷️ Tag your notes with keywords for easy searching",
        "📚 Keep a daily journal to track your thoughts"
      ],
      todos: [
        "⏰ Set specific deadlines for better accountability",
        "🎯 Focus on 3 main tasks per day",
        "🔄 Review and prioritize weekly"
      ],
      timer: [
        "🍅 Try the 25-min Pomodoro technique",
        "🛑 Take 5-min breaks between sessions",
        "📈 Track your focus patterns to find peak hours"
      ],
      spotify: [
        "🎵 Instrumental music helps with focus",
        "🎧 Create different playlists for different moods",
        "🔊 Lower volume can improve concentration"
      ]
    };

    return tips[currentWidget] || ["Keep up the great work! 🌟"];
  }
}

export const suggestionEngine = new SuggestionEngine();
