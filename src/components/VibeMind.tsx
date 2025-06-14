
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, X, MessageCircle, Lightbulb, TrendingUp } from 'lucide-react';
import { useActivityTracker } from '@/hooks/useActivityTracker';
import { suggestionEngine, Suggestion } from '@/services/suggestionEngine';
import { toast } from 'sonner';

interface VibeMindProps {
  currentWidget?: string;
}

const VibeMind: React.FC<VibeMindProps> = ({ currentWidget = '' }) => {
  const { activity } = useActivityTracker();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());
  const [isMinimized, setIsMinimized] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Generate suggestions periodically
  useEffect(() => {
    const generateSuggestions = () => {
      const newSuggestions = suggestionEngine.generateSuggestions(activity)
        .filter(s => !dismissedSuggestions.has(s.id));
      setSuggestions(newSuggestions);
    };

    generateSuggestions();
    const interval = setInterval(generateSuggestions, 2 * 60 * 1000); // Check every 2 minutes

    return () => clearInterval(interval);
  }, [activity, dismissedSuggestions]);

  const dismissSuggestion = useCallback((suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
  }, []);

  const handleSuggestionAction = useCallback((suggestion: Suggestion) => {
    if (suggestion.action) {
      // Here you could integrate with your command system
      toast.success(`Executing: ${suggestion.action.label}`);
      
      // Simulate command execution based on the command string
      switch (suggestion.action.command) {
        case 'focus-notes':
          window.dispatchEvent(new CustomEvent('vibemind:focus-widget', { detail: 'notes' }));
          break;
        case 'focus-todos':
          window.dispatchEvent(new CustomEvent('vibemind:focus-widget', { detail: 'todos' }));
          break;
        case 'start-pomodoro':
          window.dispatchEvent(new CustomEvent('vibemind:start-timer', { detail: 25 }));
          break;
        case 'start-break-timer':
          window.dispatchEvent(new CustomEvent('vibemind:start-timer', { detail: 5 }));
          break;
      }
    }
    dismissSuggestion(suggestion.id);
  }, [dismissSuggestion]);

  const getContextualTips = () => {
    return suggestionEngine.getContextualTips(currentWidget);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'celebration': return '🎉';
      case 'reminder': return '⏰';
      case 'action': return '⚡';
      default: return '💡';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500/50 bg-red-900/20';
      case 'medium': return 'border-yellow-500/50 bg-yellow-900/20';
      default: return 'border-blue-500/50 bg-blue-900/20';
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <Button
          onClick={() => setIsMinimized(false)}
          className="bg-purple-600 hover:bg-purple-700 rounded-full w-12 h-12 p-0 shadow-lg"
          title="Open VibeMind Assistant"
        >
          <Brain className="w-5 h-5" />
          {suggestions.length > 0 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card 
      className="border-purple-500/30 bg-gray-900/80 backdrop-blur-sm mb-4"
      style={{
        background: 'linear-gradient(135deg, rgba(139, 69, 196, 0.1) 0%, rgba(67, 56, 202, 0.1) 100%)'
      }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-sm text-purple-300">VibeMind</CardTitle>
            {suggestions.length > 0 && (
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            )}
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowChat(!showChat)}
              className="p-1 h-auto text-purple-400 hover:text-purple-300"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsMinimized(true)}
              className="p-1 h-auto text-purple-400 hover:text-purple-300"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Activity Summary */}
        <div className="text-xs text-gray-400 space-y-1">
          <div className="flex justify-between">
            <span>Today's Focus:</span>
            <span className="text-purple-400">{activity.timer.sessionsToday} sessions</span>
          </div>
          <div className="flex justify-between">
            <span>Todo Progress:</span>
            <span className="text-purple-400">{activity.todos.completionRate}% done</span>
          </div>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-3 rounded-lg border ${getPriorityColor(suggestion.priority)} relative`}
              >
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getSuggestionIcon(suggestion.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-200">{suggestion.title}</div>
                    <div className="text-xs text-gray-400 mt-1">{suggestion.message}</div>
                    {suggestion.action && (
                      <Button
                        size="sm"
                        onClick={() => handleSuggestionAction(suggestion)}
                        className="mt-2 bg-purple-600 hover:bg-purple-700 text-xs"
                      >
                        {suggestion.action.label}
                      </Button>
                    )}
                  </div>
                  {suggestion.dismissible && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dismissSuggestion(suggestion.id)}
                      className="p-1 h-auto text-gray-500 hover:text-gray-400"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contextual Tips */}
        {currentWidget && (
          <div className="border-t border-gray-700 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-medium text-gray-300">Quick Tips</span>
            </div>
            <div className="text-xs text-gray-400">
              {getContextualTips()[0]}
            </div>
          </div>
        )}

        {/* Simple Chat Interface */}
        {showChat && (
          <div className="border-t border-gray-700 pt-3">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-gray-300">Chat</span>
            </div>
            <div className="text-xs text-gray-400 bg-gray-800/50 rounded p-2">
              💬 Chat feature coming soon! For now, I'm watching your activity and providing smart suggestions.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VibeMind;
