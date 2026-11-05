import {
  IBloodSugarRepository,
  BloodSugarRepository,
} from '@/repositories';
import { BloodSugarLog, BloodSugarContext } from '@/types';
import { getDatabase } from '@/database/database';
import { notificationProvider, INotificationProvider } from '@/notifications';

export interface SugarAverageResult {
  average: number | null;
  count: number;
}

export interface SugarReminderConfig {
  id: string;
  label: string;
  reminderTime: string;
  enabled: boolean;
}

const DEFAULT_SUGAR_REMINDERS: SugarReminderConfig[] = [
  {
    id: 'fasting',
    label: 'Morning Fasting Check',
    reminderTime: '07:30',
    enabled: true,
  },
  {
    id: 'post_dinner',
    label: 'Post-Dinner Glucose Check',
    reminderTime: '20:00',
    enabled: true,
  },
];

export class BloodSugarService {
  constructor(
    private readonly sugarRepo: IBloodSugarRepository = new BloodSugarRepository(),
    private readonly notifier: INotificationProvider = notificationProvider
  ) {}

  async getAllLogs(): Promise<BloodSugarLog[]> {
    return this.sugarRepo.getAll();
  }

  async getLatestLog(): Promise<BloodSugarLog | null> {
    const logs = await this.sugarRepo.getAll();
    return logs[0] || null;
  }

  async addLog(params: {
    level: number;
    context: BloodSugarContext;
    loggedAt?: string;
    notes?: string;
  }): Promise<BloodSugarLog> {
    const id = `sugar_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const loggedAt = params.loggedAt || new Date().toISOString();

    return this.sugarRepo.create({
      id,
      level: Math.round(params.level),
      context: params.context,
      loggedAt,
      notes: params.notes?.trim() || undefined,
    });
  }

  async updateLog(log: BloodSugarLog): Promise<BloodSugarLog> {
    return this.sugarRepo.update(log);
  }

  async deleteLog(id: string): Promise<void> {
    return this.sugarRepo.delete(id);
  }

  // ----------------------------------------------------
  // Statistical Calculations (Weekly, Monthly, Yearly)
  // ----------------------------------------------------

  /**
   * Calculates the weekly average blood sugar for the week containing referenceDate (Mon-Sun).
   */
  calculateWeeklyAverage(
    logs: BloodSugarLog[],
    referenceDate: Date = new Date()
  ): SugarAverageResult {
    const ref = new Date(referenceDate);
    const day = ref.getDay(); // 0 is Sun, 1 is Mon
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const startOfWeek = new Date(ref);
    startOfWeek.setDate(ref.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekLogs = logs.filter((log) => {
      const logDate = new Date(log.loggedAt);
      return logDate >= startOfWeek && logDate <= endOfWeek;
    });

    if (weekLogs.length === 0) {
      return { average: null, count: 0 };
    }

    const total = weekLogs.reduce((acc, curr) => acc + curr.level, 0);
    return {
      average: Math.round(total / weekLogs.length),
      count: weekLogs.length,
    };
  }

  /**
   * Calculates the monthly average blood sugar for the month of referenceDate.
   */
  calculateMonthlyAverage(
    logs: BloodSugarLog[],
    referenceDate: Date = new Date()
  ): SugarAverageResult {
    const ref = new Date(referenceDate);
    const startOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthLogs = logs.filter((log) => {
      const logDate = new Date(log.loggedAt);
      return logDate >= startOfMonth && logDate <= endOfMonth;
    });

    if (monthLogs.length === 0) {
      return { average: null, count: 0 };
    }

    const total = monthLogs.reduce((acc, curr) => acc + curr.level, 0);
    return {
      average: Math.round(total / monthLogs.length),
      count: monthLogs.length,
    };
  }

  /**
   * Calculates the today average blood sugar.
   */
  calculateTodayAverage(
    logs: BloodSugarLog[],
    referenceDate: Date = new Date()
  ): SugarAverageResult {
    const todayStr = referenceDate.toISOString().substring(0, 10);
    const todayLogs = logs.filter((log) => log.loggedAt.substring(0, 10) === todayStr);

    if (todayLogs.length === 0) {
      return { average: null, count: 0 };
    }

    const total = todayLogs.reduce((acc, curr) => acc + curr.level, 0);
    return {
      average: Math.round(total / todayLogs.length),
      count: todayLogs.length,
    };
  }

  // ----------------------------------------------------
  // Sugar Reminders & Alarms
  // ----------------------------------------------------

  async getSugarReminders(): Promise<SugarReminderConfig[]> {
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<{
        entity_id: string;
        trigger_time: string;
        title: string;
        status: string;
      }>(
        "SELECT entity_id, trigger_time, title, status FROM reminders WHERE entity_type = 'sugar_reminder' ORDER BY trigger_time ASC;"
      );

      if (rows.length === 0) {
        for (const def of DEFAULT_SUGAR_REMINDERS) {
          await this.saveSugarReminder(def.id, def.reminderTime, def.enabled, def.label);
        }
        return DEFAULT_SUGAR_REMINDERS;
      }

      return rows.map((r) => ({
        id: r.entity_id,
        label: r.title,
        reminderTime: r.trigger_time,
        enabled: r.status === 'active',
      }));
    } catch (e) {
      console.warn('Error fetching Sugar reminders from db:', e);
      return DEFAULT_SUGAR_REMINDERS;
    }
  }

  async saveSugarReminder(
    id: string,
    reminderTime: string,
    enabled: boolean,
    label?: string
  ): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const title = label || (id === 'fasting' ? 'Morning Fasting Check' : id === 'post_dinner' ? 'Post-Dinner Glucose Check' : 'Blood Sugar Check');
    const status = enabled ? 'active' : 'disabled';
    const reminderId = `sugar_reminder_${id}`;

    await db.runAsync(
      `INSERT INTO reminders (id, entity_type, entity_id, notification_id, trigger_time, title, body, status, created_at, updated_at)
       VALUES (?, 'sugar_reminder', ?, ?, ?, ?, 'Time to check and record your blood sugar.', ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         trigger_time = excluded.trigger_time,
         title = excluded.title,
         status = excluded.status,
         updated_at = excluded.updated_at;`,
      [
        reminderId,
        id,
        `sugar_check_${id}`,
        reminderTime,
        title,
        status,
        now,
        now,
      ]
    );

    if (enabled) {
      try {
        await this.notifier.scheduleSugarReminder({
          id,
          label: title,
          reminderTime,
        });
      } catch (err) {
        console.warn(`Failed to schedule Sugar reminder for ${id}:`, err);
      }
    } else {
      try {
        await this.notifier.cancelSugarReminder(id);
      } catch (err) {
        console.warn(`Failed to cancel Sugar reminder for ${id}:`, err);
      }
    }
  }

  async addSugarReminder(label: string, reminderTime: string): Promise<SugarReminderConfig> {
    const id = `sugar_custom_${Date.now()}`;
    await this.saveSugarReminder(id, reminderTime, true, label);
    return {
      id,
      label,
      reminderTime,
      enabled: true,
    };
  }

  async deleteSugarReminder(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      "DELETE FROM reminders WHERE entity_type = 'sugar_reminder' AND entity_id = ?;",
      [id]
    );
    try {
      await this.notifier.cancelSugarReminder(id);
    } catch (e) {
      console.warn(`Failed to cancel Sugar reminder for ${id} on delete:`, e);
    }
  }

  async syncAllSugarReminders(): Promise<void> {
    const configs = await this.getSugarReminders();
    for (const cfg of configs) {
      if (cfg.enabled) {
        try {
          await this.notifier.scheduleSugarReminder({
            id: cfg.id,
            label: cfg.label,
            reminderTime: cfg.reminderTime,
          });
        } catch (err) {
          console.warn(`Failed to sync sugar reminder for ${cfg.id}:`, err);
        }
      }
    }
  }
}

export const bloodSugarService = new BloodSugarService();

