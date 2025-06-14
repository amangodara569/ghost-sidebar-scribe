
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Activity, Brain, Clock, Target } from 'lucide-react';
import { useFocusTracker } from '@/hooks/useFocusTracker';
import { motion } from 'framer-motion';

interface FocusTrackerWidgetProps {
  widgetId: string;
}

const FocusTrackerWidget: React.FC<FocusTrackerWidgetProps> = ({ widgetId }) => {
  const { getFocusReport, isNudgesEnabled, setIsNudgesEnabled } = useFocusTracker();
  const [isReportOpen, setIsReportOpen] = useState(false);
  
  const report = getFocusReport();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreGlow = (score: number) => {
    if (score >= 80) return 'shadow-green-400/30';
    if (score >= 60) return 'shadow-yellow-400/30';
    return 'shadow-red-400/30';
  };

  const formatLastActive = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) return `${minutes}m ago`;
    return `${seconds}s ago`;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <Card 
      className="focus-tracker-widget transition-all duration-300"
      style={{
        backgroundColor: 'rgba(25, 25, 25, 0.6)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Brain className="w-4 h-4 text-purple-400" />
          Focus Tracker
          {report.isIdle && (
            <Badge variant="secondary" className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-400/30">
              Idle
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Focus Score Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className={`
                w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm
                border-2 shadow-lg transition-all duration-300
                ${getScoreColor(report.currentScore)} ${getScoreGlow(report.currentScore)}
              `}
              style={{
                backgroundColor: 'rgba(40, 40, 40, 0.8)',
                borderColor: report.currentScore >= 80 ? '#4ade80' : 
                           report.currentScore >= 60 ? '#facc15' : '#ef4444'
              }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {report.currentScore}
            </motion.div>
            <div className="text-xs text-gray-400">
              <div>Focus Score</div>
              <div>Last: {formatLastActive(report.lastActive)}</div>
            </div>
          </div>

          <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                variant="ghost"
                className="text-xs hover:bg-white/10"
              >
                View Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  Today's Focus Report
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Score Overview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-gray-800/50">
                    <div className={`text-2xl font-bold ${getScoreColor(report.currentScore)}`}>
                      {report.currentScore}
                    </div>
                    <div className="text-xs text-gray-400">Current Score</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-gray-800/50">
                    <div className={`text-2xl font-bold ${getScoreColor(report.averageScore)}`}>
                      {report.averageScore}
                    </div>
                    <div className="text-xs text-gray-400">Average Score</div>
                  </div>
                </div>

                {/* Activity Stats */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-sm">Active Time</span>
                    </div>
                    <span className="text-sm font-semibold">{formatTime(report.totalActiveTime)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-green-400" />
                      <span className="text-sm">Focus Sessions</span>
                    </div>
                    <span className="text-sm font-semibold">{report.sessionsToday}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <span className="text-sm">Longest Streak</span>
                    </div>
                    <span className="text-sm font-semibold">{formatTime(report.streakMinutes)}</span>
                  </div>
                </div>

                {/* Settings */}
                <div className="pt-4 border-t border-gray-700">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="nudges-toggle" className="text-sm">
                      Focus Nudges
                    </Label>
                    <Switch
                      id="nudges-toggle"
                      checked={isNudgesEnabled}
                      onCheckedChange={setIsNudgesEnabled}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Get gentle reminders to stay focused
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 rounded bg-gray-800/30">
            <div className="font-semibold text-blue-400">{formatTime(report.totalActiveTime)}</div>
            <div className="text-gray-500">Active</div>
          </div>
          <div className="text-center p-2 rounded bg-gray-800/30">
            <div className="font-semibold text-green-400">{report.sessionsToday}</div>
            <div className="text-gray-500">Sessions</div>
          </div>
          <div className="text-center p-2 rounded bg-gray-800/30">
            <div className="font-semibold text-purple-400">{formatTime(report.streakMinutes)}</div>
            <div className="text-gray-500">Streak</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FocusTrackerWidget;
