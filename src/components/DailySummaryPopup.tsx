
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Calendar, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVibeAnalytics } from '@/hooks/useVibeAnalytics';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const DailySummaryPopup: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [lastShown, setLastShown] = useLocalStorage('daily-summary-last-shown', '');
  const { dailySummary, todayStats } = useVibeAnalytics();

  useEffect(() => {
    const today = new Date().toDateString();
    const now = new Date();
    const hour = now.getHours();

    // Show popup once per day, after 6 PM or if user has been active for a while
    if (lastShown !== today && (hour >= 18 || todayStats.timer.totalMinutes > 60)) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000); // Show after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [lastShown, todayStats.timer.totalMinutes]);

  const handleClose = () => {
    setIsVisible(false);
    setLastShown(new Date().toDateString());
  };

  const moodEmojis = {
    productive: '🚀',
    relaxed: '😌',
    busy: '⚡',
    balanced: '⚖️'
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="rounded-lg p-6 max-w-md w-full shadow-2xl"
            style={{ 
              backgroundColor: 'var(--theme-surface)',
              color: 'var(--theme-text)',
              border: '1px solid var(--theme-border)'
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Daily Vibe Check</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="text-center mb-6">
              <div className="text-4xl mb-2">{moodEmojis[dailySummary.mood]}</div>
              <h4 className="text-xl font-semibold capitalize mb-2">{dailySummary.mood} Day</h4>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-lg font-bold">{dailySummary.score}% Focus Score</span>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h5 className="font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Today's Highlights
              </h5>
              {dailySummary.keyStats.length > 0 ? (
                <ul className="space-y-1">
                  {dailySummary.keyStats.map((stat, index) => (
                    <li key={index} className="text-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--theme-accent)' }} />
                      {stat}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm opacity-70">Take a moment to start your productivity journey!</p>
              )}
            </div>

            {dailySummary.patterns.length > 0 && (
              <div className="mb-6">
                <h5 className="font-semibold mb-2">Today's Pattern</h5>
                <div className="text-sm p-3 rounded" style={{ backgroundColor: 'var(--theme-background)' }}>
                  <div className="font-medium">{dailySummary.patterns[0].title}</div>
                  <div className="opacity-80">{dailySummary.patterns[0].description}</div>
                  {dailySummary.patterns[0].suggestion && (
                    <div className="mt-2 text-xs italic opacity-70">
                      💡 {dailySummary.patterns[0].suggestion}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="text-center">
              <p className="text-sm italic opacity-80 mb-4">"{dailySummary.quote}"</p>
              <Button onClick={handleClose} className="w-full">
                Thanks for the update!
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DailySummaryPopup;
