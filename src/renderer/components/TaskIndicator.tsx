import React, { useState, useEffect } from 'react';
import { BackgroundTask, TASK_IPC } from '../../shared/taskTypes';

interface TaskIndicatorProps {
  className?: string;
}

export default function TaskIndicator({ className }: TaskIndicatorProps) {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    // Load initial tasks
    window.journal.getTasks().then(setTasks);

    // Listen for task updates
    const handleTaskUpdate = (_event: any, task: BackgroundTask | BackgroundTask[]) => {
      if (Array.isArray(task)) {
        setTasks(task);
      } else {
        setTasks((prev) => {
          const index = prev.findIndex((t) => t.id === task.id);
          if (index >= 0) {
            const newTasks = [...prev];
            newTasks[index] = task;
            return newTasks;
          } else {
            return [...prev, task];
          }
        });
      }
    };

    window.electron.ipcRenderer.on(TASK_IPC.TASK_UPDATED, handleTaskUpdate);

    return () => {
      window.electron.ipcRenderer.removeListener(TASK_IPC.TASK_UPDATED, handleTaskUpdate);
    };
  }, []);

  const activeTasks = tasks.filter(
    (t) => t.status === 'running' || t.status === 'pending'
  );
  const recentTasks = tasks.filter(
    (t) => t.status === 'completed' || t.status === 'failed'
  );

  if (tasks.length === 0) {
    return null;
  }

  const handleCancelTask = (taskId: string) => {
    window.journal.cancelTask(taskId);
  };

  return (
    <div className={`task-indicator ${className || ''}`}>
      <button
        className="task-indicator-button"
        onClick={() => setExpanded(!expanded)}
        title="Background Tasks"
      >
        <span className="task-count">{activeTasks.length}</span>
        <span className="task-icon">⚙️</span>
      </button>

      {expanded && (
        <div className="task-panel">
          <div className="task-panel-header">
            <h3>Background Tasks</h3>
            <button className="task-panel-close" onClick={() => setExpanded(false)}>
              &times;
            </button>
          </div>

          <div className="task-panel-body">
            {activeTasks.length > 0 && (
              <div className="task-section">
                <h4>Active</h4>
                {activeTasks.map((task) => (
                  <div key={task.id} className="task-item task-active">
                    <div className="task-header">
                      <span className="task-title">{task.title}</span>
                      {task.cancellable && (
                        <button
                          className="task-cancel"
                          onClick={() => handleCancelTask(task.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                    {task.description && (
                      <div className="task-description">{task.description}</div>
                    )}
                    <div className="task-progress-bar">
                      <div
                        className="task-progress-fill"
                        style={{ width: `${task.progress || 0}%` }}
                      />
                    </div>
                    <div className="task-progress-text">{task.progress || 0}%</div>
                  </div>
                ))}
              </div>
            )}

            {recentTasks.length > 0 && (
              <div className="task-section">
                <h4>Recent</h4>
                {recentTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className={`task-item task-${task.status}`}
                  >
                    <div className="task-header">
                      <span className="task-title">{task.title}</span>
                      <span
                        className={`task-status task-status-${task.status}`}
                      >
                        {task.status === 'completed' ? '✓' : '✗'}
                      </span>
                    </div>
                    {task.error && (
                      <div className="task-error">{task.error}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTasks.length === 0 && recentTasks.length === 0 && (
              <div className="task-empty">No active tasks</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
