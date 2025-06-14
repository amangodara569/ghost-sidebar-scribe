
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Download, RotateCcw, Calendar, Target, Brain, Clock } from 'lucide-react';
import { useVibeAnalytics } from '@/hooks/useVibeAnalytics';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { toast } from 'sonner';

const AnalyticsDashboard: React.FC = () => {
  const { todayStats, weekStats, dailySummary, getInsights, exportData } = useVibeAnalytics();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | 'week' | 'month'>('7d');
  const [selectedMetric, setSelectedMetric] = useState<'focus' | 'tasks' | 'notes'>('focus');

  // Calculate productivity score
  const productivityScore = useMemo(() => {
    const focusWeight = 0.4;
    const taskWeight = 0.35;
    const noteWeight = 0.25;
    
    const focusScore = Math.min(todayStats.timer.totalMinutes / 120, 1) * 100; // 2h = max
    const taskScore = Math.min(todayStats.todos.completed / 5, 1) * 100; // 5 tasks = max
    const noteScore = Math.min(todayStats.notes.saved / 3, 1) * 100; // 3 notes = max
    
    return Math.round(focusScore * focusWeight + taskScore * taskWeight + noteScore * noteWeight);
  }, [todayStats]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 7;
    return Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - 1 - i);
      const dayName = format(date, 'EEE');
      const stats = weekStats.find(s => s.date === date.toDateString()) || {
        timer: { totalMinutes: 0 },
        todos: { completed: 0 },
        notes: { saved: 0 }
      };
      
      return {
        day: dayName,
        date: format(date, 'MMM dd'),
        focus: stats.timer.totalMinutes || 0,
        tasks: stats.todos.completed || 0,
        notes: stats.notes.saved || 0,
        score: Math.round(
          (Math.min(stats.timer.totalMinutes / 120, 1) * 40) +
          (Math.min(stats.todos.completed / 5, 1) * 35) +
          (Math.min(stats.notes.saved / 3, 1) * 25)
        )
      };
    });
  }, [weekStats, selectedPeriod]);

  // Activity distribution data
  const activityData = [
    { name: 'Focus Time', value: todayStats.timer.totalMinutes, color: '#8b5cf6' },
    { name: 'Notes', value: todayStats.notes.saved * 10, color: '#06b6d4' },
    { name: 'Tasks', value: todayStats.todos.completed * 5, color: '#10b981' },
    { name: 'Spotify', value: todayStats.spotify.interactions * 2, color: '#f59e0b' }
  ];

  const handleExport = () => {
    try {
      const data = exportData();
      const csv = convertToCSV(data);
      downloadCSV(csv, `vibemind-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      toast.success('Analytics data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const convertToCSV = (data: any) => {
    const headers = ['Date', 'Focus Time (min)', 'Tasks Completed', 'Notes Saved', 'Productivity Score'];
    const rows = chartData.map(day => [
      day.date,
      day.focus,
      day.tasks,
      day.notes,
      day.score
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const resetData = () => {
    if (confirm('Are you sure you want to reset all analytics data? This action cannot be undone.')) {
      localStorage.removeItem('vibemind-analytics');
      toast.success('Analytics data reset successfully');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-gray-900 to-gray-800 min-h-screen text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Track your productivity patterns and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="border-gray-600 hover:bg-gray-700">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={resetData} className="border-red-600 hover:bg-red-900/20">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Data
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">Today's Focus</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {todayStats.timer.totalMinutes}m
            </div>
            <div className="text-xs text-gray-500">
              {todayStats.timer.sessions} sessions
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Tasks Done</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {todayStats.todos.completed}
            </div>
            <div className="text-xs text-gray-500">
              {Math.round((todayStats.todos.completed / Math.max(todayStats.todos.added, 1)) * 100)}% completion
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-cyan-400" />
              <span className="text-sm text-gray-400">Notes Created</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {todayStats.notes.saved}
            </div>
            <div className="text-xs text-gray-500">
              {todayStats.notes.totalWords} words total
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">Productivity Score</span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              {productivityScore}%
            </div>
            <Badge variant={productivityScore >= 80 ? "default" : productivityScore >= 60 ? "secondary" : "destructive"} className="mt-1">
              {productivityScore >= 80 ? "Excellent" : productivityScore >= 60 ? "Good" : "Needs Work"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-gray-800 border border-gray-700">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="focus">Focus Time</SelectItem>
                <SelectItem value="tasks">Tasks</SelectItem>
                <SelectItem value="notes">Notes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="trends" className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Productivity Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  focus: { label: "Focus Time (min)", color: "#8b5cf6" },
                  tasks: { label: "Tasks Completed", color: "#10b981" },
                  notes: { label: "Notes Saved", color: "#06b6d4" },
                  score: { label: "Productivity Score", color: "#f59e0b" }
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="day" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke={selectedMetric === 'focus' ? '#8b5cf6' : selectedMetric === 'tasks' ? '#10b981' : '#06b6d4'}
                      strokeWidth={3}
                      dot={{ fill: selectedMetric === 'focus' ? '#8b5cf6' : selectedMetric === 'tasks' ? '#10b981' : '#06b6d4', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Daily Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  focus: { label: "Focus Time", color: "#8b5cf6" },
                  tasks: { label: "Tasks", color: "#10b981" },
                  notes: { label: "Notes", color: "#06b6d4" }
                }}
                className="h-64"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="day" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="focus" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="tasks" fill="#10b981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="notes" fill="#06b6d4" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Activity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  focus: { label: "Focus Time", color: "#8b5cf6" },
                  notes: { label: "Notes", color: "#06b6d4" },
                  tasks: { label: "Tasks", color: "#10b981" },
                  spotify: { label: "Spotify", color: "#f59e0b" }
                }}
                className="h-80"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {activityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Daily Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {getInsights().map((insight, index) => (
                <div key={index} className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <p className="text-gray-200">{insight}</p>
                </div>
              ))}
              {getInsights().length === 0 && (
                <p className="text-gray-400 text-center py-8">
                  Keep using VibeMind to generate personalized insights!
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;
