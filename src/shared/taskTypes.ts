/**
 * Background Task System Types
 *
 * Manages async operations like indexing, pattern detection, and AI generation
 * without blocking the UI.
 */

export type TaskType =
  | 'build-index'
  | 'generate-monthly-summary'
  | 'detect-patterns'
  | 'generate-insights';

export type TaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface BackgroundTask {
  id: string;
  type: TaskType;
  status: TaskStatus;
  title: string;
  description?: string;
  progress?: number; // 0-100
  startTime?: number; // timestamp
  endTime?: number; // timestamp
  error?: string;
  result?: any;
  cancellable: boolean;
}

export interface TaskProgress {
  taskId: string;
  progress: number;
  message?: string;
}

// IPC Events for task management
export const TASK_IPC = {
  START_TASK: 'task:start',
  CANCEL_TASK: 'task:cancel',
  GET_TASKS: 'task:get-all',
  TASK_UPDATED: 'task:updated',
  TASK_PROGRESS: 'task:progress',
} as const;
