import { getDatabase } from '@/database/database';

export type AppThemeMode = 'light' | 'dark' | 'system';

export class SettingsService {
  async getSetting(key: string): Promise<string | null> {
    try {
      const db = getDatabase();
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?;',
        [key]
      );
      return row ? row.value : null;
    } catch {
      return null;
    }
  }

  async setSetting(key: string, value: string): Promise<void> {
    try {
      const db = getDatabase();
      const now = new Date().toISOString();
      await db.runAsync(
        `INSERT INTO app_settings (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = excluded.updated_at;`,
        [key, value, now]
      );
    } catch (e) {
      console.warn('Failed to save setting:', key, e);
    }
  }

  async getThemeMode(): Promise<AppThemeMode> {
    const val = await this.getSetting('theme_mode');
    if (val === 'light' || val === 'dark' || val === 'system') {
      return val;
    }
    return 'light'; // Default to warm light linen mode for Mom!
  }

  async setThemeMode(mode: AppThemeMode): Promise<void> {
    await this.setSetting('theme_mode', mode);
  }

  async hasPromptedPermissions(): Promise<boolean> {
    const val = await this.getSetting('permissions_prompt_decided');
    return val === 'true';
  }

  async markPermissionsPromptDecided(): Promise<void> {
    await this.setSetting('permissions_prompt_decided', 'true');
  }
}

export const settingsService = new SettingsService();
