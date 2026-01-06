import { ipcMain } from 'electron';
import { TASK_IPC, TaskType } from '../shared/taskTypes';
import { taskManager } from './taskManager';
import { buildIndex, writeIndex } from '../services/indexing/indexBuilder';
import { generateMonthlySummary } from './ai';
import { generatePatternReport } from '../services/insights/patternDetection';
import { loadSettings } from './ipc';
import path from 'path';
import fs from 'fs/promises';

/**
 * Register IPC handlers for background tasks
 */
export function registerTaskHandlers(): void {
  // Get all tasks
  ipcMain.handle(TASK_IPC.GET_TASKS, () => {
    return taskManager.getAllTasks();
  });

  // Cancel a task
  ipcMain.handle(TASK_IPC.CANCEL_TASK, (_, taskId: string) => {
    taskManager.cancelTask(taskId);
    return { success: true };
  });

  // Start a background task
  ipcMain.handle(TASK_IPC.START_TASK, async (_, type: TaskType, params?: any) => {
    const settings = await loadSettings();

    switch (type) {
      case 'build-index':
        return await runBuildIndexTask(settings.journalPath!);

      case 'generate-monthly-summary':
        return await runMonthlySummaryTask(settings.journalPath!, settings.aiApiKey!, params.month);

      case 'detect-patterns':
        return await runPatternDetectionTask(settings.journalPath!, params.days || 90);

      default:
        throw new Error(`Unknown task type: ${type}`);
    }
  });
}

/**
 * Run index building task
 */
async function runBuildIndexTask(journalPath: string): Promise<{ taskId: string }> {
  const task = taskManager.createTask(
    'build-index',
    'Building Journal Index',
    'Analyzing entries and AI outputs...'
  );

  // Run task in background
  setImmediate(async () => {
    try {
      taskManager.startTask(task.id);

      taskManager.updateProgress(task.id, 10, 'Reading journal files...');
      const index = await buildIndex(journalPath);

      taskManager.updateProgress(task.id, 80, 'Writing index to disk...');
      await writeIndex(journalPath, index);

      taskManager.updateProgress(task.id, 100, 'Index built successfully');
      taskManager.completeTask(task.id, index);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      taskManager.failTask(task.id, errorMessage);
    }
  });

  return { taskId: task.id };
}

/**
 * Run monthly summary generation task
 */
async function runMonthlySummaryTask(
  journalPath: string,
  apiKey: string,
  month: string
): Promise<{ taskId: string }> {
  const task = taskManager.createTask(
    'generate-monthly-summary',
    `Generating Summary for ${month}`,
    'Reading entries...'
  );

  // Run task in background
  setImmediate(async () => {
    try {
      taskManager.startTask(task.id);

      taskManager.updateProgress(task.id, 20, 'Loading entries...');

      // Load entries for the month
      const entriesPath = path.join(journalPath, 'entries');
      const entries: { date: string; content: string; path: string }[] = [];

      const [year, monthNum] = month.split('-');
      const monthPath = path.join(entriesPath, year, monthNum);

      try {
        const files = await fs.readdir(monthPath);
        taskManager.updateProgress(task.id, 40, `Found ${files.length} entries`);

        for (const file of files) {
          if (file.endsWith('.md')) {
            const filePath = path.join(monthPath, file);
            const content = await fs.readFile(filePath, 'utf-8');
            const date = file.replace('.md', '');
            entries.push({ date, content, path: file });
          }
        }
      } catch {
        // Month folder doesn't exist
      }

      taskManager.updateProgress(task.id, 60, 'Generating AI summary...');
      const aiOutput = await generateMonthlySummary(entries, month);

      taskManager.updateProgress(task.id, 90, 'Saving summary...');
      const summaryPath = path.join(journalPath, 'ai', 'monthly', `${month}.summary.md`);
      await fs.mkdir(path.dirname(summaryPath), { recursive: true });
      await fs.writeFile(summaryPath, aiOutput.content, 'utf-8');

      taskManager.updateProgress(task.id, 100, 'Summary generated successfully');
      taskManager.completeTask(task.id, { summary: aiOutput, path: summaryPath });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      taskManager.failTask(task.id, errorMessage);
    }
  });

  return { taskId: task.id };
}

/**
 * Run pattern detection task
 */
async function runPatternDetectionTask(journalPath: string, days: number): Promise<{ taskId: string }> {
  const task = taskManager.createTask(
    'detect-patterns',
    'Detecting Patterns',
    `Analyzing last ${days} days...`
  );

  // Run task in background
  setImmediate(async () => {
    try {
      taskManager.startTask(task.id);

      taskManager.updateProgress(task.id, 20, 'Loading index...');
      const { readIndex } = await import('../services/indexing/indexBuilder');
      const index = await readIndex(journalPath);

      if (!index) {
        throw new Error('Index not found. Please build index first.');
      }

      taskManager.updateProgress(task.id, 50, 'Analyzing patterns...');
      const report = generatePatternReport(index, days);

      taskManager.updateProgress(task.id, 100, 'Patterns detected');
      taskManager.completeTask(task.id, report);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      taskManager.failTask(task.id, errorMessage);
    }
  });

  return { taskId: task.id };
}
