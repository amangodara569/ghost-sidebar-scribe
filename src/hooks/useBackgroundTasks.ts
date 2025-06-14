
import { useEffect, useRef, useCallback } from 'react';

interface BackgroundTask {
  id: string;
  interval: number;
  callback: () => void;
  enabled: boolean;
}

export const useBackgroundTasks = () => {
  const tasks = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const isVisible = useRef(true);

  // Track page visibility to maintain background tasks
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisible.current = !document.hidden;
      console.log('Page visibility changed:', isVisible.current ? 'visible' : 'hidden');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const registerTask = useCallback((task: BackgroundTask) => {
    if (tasks.current.has(task.id)) {
      clearInterval(tasks.current.get(task.id));
    }

    if (task.enabled) {
      const intervalId = setInterval(() => {
        try {
          task.callback();
        } catch (error) {
          console.error(`Background task ${task.id} failed:`, error);
        }
      }, task.interval);

      tasks.current.set(task.id, intervalId);
      console.log(`Background task registered: ${task.id} (${task.interval}ms interval)`);
    }
  }, []);

  const unregisterTask = useCallback((taskId: string) => {
    const intervalId = tasks.current.get(taskId);
    if (intervalId) {
      clearInterval(intervalId);
      tasks.current.delete(taskId);
      console.log(`Background task unregistered: ${taskId}`);
    }
  }, []);

  const unregisterAllTasks = useCallback(() => {
    tasks.current.forEach((intervalId, taskId) => {
      clearInterval(intervalId);
      console.log(`Background task cleaned up: ${taskId}`);
    });
    tasks.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return unregisterAllTasks;
  }, [unregisterAllTasks]);

  return {
    registerTask,
    unregisterTask,
    unregisterAllTasks,
    isPageVisible: () => isVisible.current
  };
};
