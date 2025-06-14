
import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  memoryUsage: number;
  renderTime: number;
  timestamp: Date;
}

export const usePerformanceMonitor = (componentName: string, enabled: boolean = process.env.NODE_ENV === 'development') => {
  const renderStartTime = useRef<number>(0);
  const lastLogTime = useRef<number>(0);

  useEffect(() => {
    if (!enabled) return;

    renderStartTime.current = performance.now();

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      const now = Date.now();

      // Log performance metrics every minute (debounced)
      if (now - lastLogTime.current > 60000) {
        const metrics: PerformanceMetrics = {
          memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
          renderTime,
          timestamp: new Date()
        };

        console.log(`[Performance Monitor] ${componentName}:`, {
          'Memory Usage (MB)': Math.round(metrics.memoryUsage / 1024 / 1024 * 100) / 100,
          'Render Time (ms)': Math.round(renderTime * 100) / 100,
          'Timestamp': metrics.timestamp.toISOString()
        });

        lastLogTime.current = now;
      }
    };
  });

  const logCustomMetric = (metricName: string, value: number) => {
    if (enabled) {
      console.log(`[Performance Monitor] ${componentName} - ${metricName}:`, value);
    }
  };

  return { logCustomMetric };
};
