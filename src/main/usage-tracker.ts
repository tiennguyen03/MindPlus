import { Settings, UsageStats, DEFAULT_SETTINGS } from '../shared/types';
import { app } from 'electron';
import fs from 'fs/promises';
import path from 'path';

function getSettingsPath(): string {
  return path.join(app.getPath('userData'), 'settings.json');
}

async function loadSettings(): Promise<Settings> {
  try {
    const data = await fs.readFile(getSettingsPath(), 'utf-8');
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

async function saveSettings(settings: Settings): Promise<void> {
  await fs.writeFile(getSettingsPath(), JSON.stringify(settings, null, 2));
}

/**
 * Track when an entry is written
 */
export async function trackEntryWritten(): Promise<void> {
  try {
    const settings = await loadSettings();
    const updatedStats = await updateUsageStats(settings, 'entriesWritten');
    await saveSettings({ ...settings, usageStats: updatedStats });
  } catch (error) {
    console.error('Failed to track entry written:', error);
  }
}

/**
 * Track when an AI call is made
 */
export async function trackAICall(): Promise<void> {
  try {
    const settings = await loadSettings();
    const updatedStats = await updateUsageStats(settings, 'aiCallsUsed');
    await saveSettings({ ...settings, usageStats: updatedStats });
  } catch (error) {
    console.error('Failed to track AI call:', error);
  }
}

/**
 * Track daily activity (called on app launch or when creating/editing entries)
 */
export async function trackDayActive(): Promise<void> {
  try {
    const settings = await loadSettings();
    const today = new Date().toISOString().split('T')[0];

    // Only increment if this is a new day
    if (settings.usageStats.lastActiveDate !== today) {
      const updatedStats: UsageStats = {
        ...settings.usageStats,
        daysActive: settings.usageStats.daysActive + 1,
        lastActiveDate: today,
      };
      await saveSettings({ ...settings, usageStats: updatedStats });
    }
  } catch (error) {
    console.error('Failed to track day active:', error);
  }
}

/**
 * Helper to update a specific usage stat counter
 */
async function updateUsageStats(
  settings: Settings,
  stat: 'entriesWritten' | 'aiCallsUsed'
): Promise<UsageStats> {
  const today = new Date().toISOString().split('T')[0];

  return {
    ...settings.usageStats,
    [stat]: settings.usageStats[stat] + 1,
    lastActiveDate: today,
  };
}
