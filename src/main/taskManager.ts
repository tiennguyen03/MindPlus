import { BrowserWindow } from 'electron';
import { BackgroundTask, TaskType, TASK_IPC } from '../shared/taskTypes';
import crypto from 'crypto';

/**
 * Generate a unique task ID
 */
function generateTaskId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Background Task Manager
 *
 * Manages a queue of async tasks and provides progress updates to the renderer.
 */
class TaskManager {
  private tasks: Map<string, BackgroundTask> = new Map();
  private mainWindow: BrowserWindow | null = null;

  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
  }

  /**
   * Create a new background task
   */
  createTask(type: TaskType, title: string, description?: string): BackgroundTask {
    const task: BackgroundTask = {
      id: generateTaskId(),
      type,
      status: 'pending',
      title,
      description,
      progress: 0,
      cancellable: true,
    };

    this.tasks.set(task.id, task);
    this.notifyTaskUpdate(task);
    return task;
  }

  /**
   * Start a task
   */
  startTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'running';
    task.startTime = Date.now();
    task.progress = 0;

    this.tasks.set(taskId, task);
    this.notifyTaskUpdate(task);
  }

  /**
   * Update task progress
   */
  updateProgress(taskId: string, progress: number, message?: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.progress = Math.min(100, Math.max(0, progress));
    if (message) {
      task.description = message;
    }

    this.tasks.set(taskId, task);
    this.notifyTaskUpdate(task);
  }

  /**
   * Mark task as completed
   */
  completeTask(taskId: string, result?: any): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.progress = 100;
    task.endTime = Date.now();
    task.result = result;

    this.tasks.set(taskId, task);
    this.notifyTaskUpdate(task);

    // Auto-remove completed tasks after 5 seconds
    setTimeout(() => {
      this.removeTask(taskId);
    }, 5000);
  }

  /**
   * Mark task as failed
   */
  failTask(taskId: string, error: string): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'failed';
    task.endTime = Date.now();
    task.error = error;

    this.tasks.set(taskId, task);
    this.notifyTaskUpdate(task);

    // Auto-remove failed tasks after 10 seconds
    setTimeout(() => {
      this.removeTask(taskId);
    }, 10000);
  }

  /**
   * Cancel a task
   */
  cancelTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task || !task.cancellable) return;

    task.status = 'cancelled';
    task.endTime = Date.now();

    this.tasks.set(taskId, task);
    this.notifyTaskUpdate(task);

    // Auto-remove cancelled tasks after 3 seconds
    setTimeout(() => {
      this.removeTask(taskId);
    }, 3000);
  }

  /**
   * Remove a task from the queue
   */
  removeTask(taskId: string): void {
    this.tasks.delete(taskId);
    this.notifyAllTasks();
  }

  /**
   * Get all tasks
   */
  getAllTasks(): BackgroundTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * Get a specific task
   */
  getTask(taskId: string): BackgroundTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Check if a task is running
   */
  isTaskRunning(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    return task?.status === 'running';
  }

  /**
   * Notify renderer of task update
   */
  private notifyTaskUpdate(task: BackgroundTask): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(TASK_IPC.TASK_UPDATED, task);
    }
  }

  /**
   * Notify renderer of all tasks
   */
  private notifyAllTasks(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(TASK_IPC.TASK_UPDATED, this.getAllTasks());
    }
  }
}

// Singleton instance
export const taskManager = new TaskManager();
