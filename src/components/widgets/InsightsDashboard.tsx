
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, Clock, CheckCircle, BookOpen, Music, Mic, Download, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useVibeAnalytics } from '@/hooks/useVibeAnalytics';

const InsightsDashboard: React.FC<{ widgetId: string }> = ({ widgetId, ...props }) => {
  const { todayStats, weekStats, dailySummary, exportData } = useVibeAnalytics();
  const [activeTab, setActiveTab] = useState('today');

  const moodColors = {
    productive: '#10b981',
    relaxed: '#06b6d4',
    busy: '#f59e0b',
    balanced: '#8b5cf6'
  };

  const weekChartData = weekStats.map((day, index) => ({
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index],
    focus: day.timer.totalMinutes,
    todos: day.todos.completed,
    notes: day.notes.saved,
    score: day.focusScore
  }));

  const todayBreakdown = [
    { name: 'Notes', value: todayStats.notes.saved, color: '#8b5cf6' },
    { name: 'Todos', value: todayStats.todos.completed, color: '#10b981' },
    { name: 'Focus', value: Math.round(todayStats.timer.totalMinutes / 10), color: '#f59e0b' },
    { name: 'Bookmarks', value: todayStats.bookmarks.saved, color: '#06b6d4' }
  ];

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibemind-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="p-6 space-y-6"
      style={{ color: 'var(--theme-text)' }}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Vibe Tracker</h2>
          <p className="text-sm opacity-70">Your productivity insights & patterns</p>
        </div>
        <Button 
          onClick={handleExport}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export
        </Button>
      </div>

      {/* Daily Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg p-6 relative overflow-hidden"
        style={{ 
          backgroundColor: 'var(--theme-surface)',
          borderColor: moodColors[dailySummary.mood],
          border: `2px solid ${moodColors[dailySummary.mood]}`
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold capitalize">{dailySummary.mood} Day</h3>
            <p className="text-sm opacity-70">Focus Score: {dailySummary.score}%</p>
          </div>
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: moodColors[dailySummary.mood] + '20', color: moodColors[dailySummary.mood] }}
          >
            {dailySummary.score}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {dailySummary.keyStats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-lg font-semibold">{stat}</div>
            </div>
          ))}
        </div>

        <div className="text-sm italic opacity-80">
          "{dailySummary.quote}"
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Today's Activity Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Today's Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={todayBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {todayBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Today's Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                  <div className="text-2xl font-bold">{Math.round(todayStats.timer.totalMinutes)}</div>
                  <div className="text-sm opacity-70">Focus Minutes</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <div className="text-2xl font-bold">{todayStats.todos.completed}</div>
                  <div className="text-sm opacity-70">Todos Done</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                  <div className="text-2xl font-bold">{todayStats.notes.saved}</div>
                  <div className="text-sm opacity-70">Notes Saved</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Mic className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                  <div className="text-2xl font-bold">{todayStats.voice.commands}</div>
                  <div className="text-sm opacity-70">Voice Commands</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="week" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Focus Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weekChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="focus" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weekChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="todos" fill="#10b981" />
                  <Bar dataKey="notes" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid gap-4">
            {dailySummary.patterns.map((pattern, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{pattern.title}</h4>
                      <div className="text-xs px-2 py-1 rounded-full" style={{ 
                        backgroundColor: 'var(--theme-accent)', 
                        color: 'var(--theme-background)' 
                      }}>
                        {Math.round(pattern.confidence * 100)}% confidence
                      </div>
                    </div>
                    <p className="text-sm opacity-80 mb-2">{pattern.description}</p>
                    {pattern.suggestion && (
                      <p className="text-xs italic opacity-70">💡 {pattern.suggestion}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InsightsDashboard;
