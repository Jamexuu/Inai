import {
  IBloodPressureRepository,
  BloodPressureRepository,
} from '@/repositories';
import { BloodPressureLog } from '@/types';
import { INotificationProvider, notificationProvider } from '@/notifications';
import { getDatabase } from '@/database/database';

export interface BPReminderConfig {
  id: string;
  label: string;
  reminderTime: string; // 24-hr format like "08:00" or "19:00"
  enabled: boolean;
}

export interface BPAverageResult {
  avgSystolic: number | null;
  avgDiastolic: number | null;
  avgPulse: number | null;
  count: number;
}

const DEFAULT_BP_REMINDERS: BPReminderConfig[] = [
  { id: 'morning', label: 'Morning Blood Pressure Check', reminderTime: '08:00', enabled: true },
  { id: 'evening', label: 'Evening Blood Pressure Check', reminderTime: '19:00', enabled: true },
];

export class BloodPressureService {
  private customNotifier?: INotificationProvider;

  constructor(
    private readonly bpRepo: IBloodPressureRepository = new BloodPressureRepository(),
    notifier?: INotificationProvider
  ) {
    this.customNotifier = notifier;
  }

  private get notifier(): INotificationProvider {
    return this.customNotifier ?? notificationProvider;
  }

  async getAllLogs(): Promise<BloodPressureLog[]> {
    return this.bpRepo.getAll();
  }

  async getLatestLog(): Promise<BloodPressureLog | null> {
    const logs = await this.bpRepo.getAll();
    return logs[0] || null;
  }

  async addLog(params: {
    systolic: number;
    diastolic: number;
    pulse?: number;
    loggedAt?: string;
    notes?: string;
    arm?: 'left' | 'right';
  }): Promise<BloodPressureLog> {
    const id = `bp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const loggedAt = params.loggedAt || new Date().toISOString();

    return this.bpRepo.create({
      id,
      systolic: Math.round(params.systolic),
      diastolic: Math.round(params.diastolic),
      pulse: params.pulse ? Math.round(params.pulse) : undefined,
      loggedAt,
      notes: params.notes?.trim() || undefined,
      arm: params.arm,
    });
  }

  async updateLog(log: BloodPressureLog): Promise<BloodPressureLog> {
    return this.bpRepo.update(log);
  }

  async deleteLog(id: string): Promise<void> {
    return this.bpRepo.delete(id);
  }

  // ----------------------------------------------------
  // Statistical Calculations (Weekly, Monthly, Today)
  // ----------------------------------------------------

  /**
   * Calculates the weekly average blood pressure for the week containing referenceDate (Mon-Sun).
   */
  calculateWeeklyAverage(
    logs: BloodPressureLog[],
    referenceDate: Date = new Date()
  ): BPAverageResult {
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
      return { avgSystolic: null, avgDiastolic: null, avgPulse: null, count: 0 };
    }

    const totalSys = weekLogs.reduce((acc, curr) => acc + curr.systolic, 0);
    const totalDia = weekLogs.reduce((acc, curr) => acc + curr.diastolic, 0);
    const pulseLogs = weekLogs.filter((l) => l.pulse !== undefined && l.pulse > 0);
    const totalPulse = pulseLogs.reduce((acc, curr) => acc + (curr.pulse || 0), 0);

    return {
      avgSystolic: Math.round(totalSys / weekLogs.length),
      avgDiastolic: Math.round(totalDia / weekLogs.length),
      avgPulse: pulseLogs.length > 0 ? Math.round(totalPulse / pulseLogs.length) : null,
      count: weekLogs.length,
    };
  }

  /**
   * Calculates the monthly average blood pressure for the month of referenceDate.
   */
  calculateMonthlyAverage(
    logs: BloodPressureLog[],
    referenceDate: Date = new Date()
  ): BPAverageResult {
    const ref = new Date(referenceDate);
    const startOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthLogs = logs.filter((log) => {
      const logDate = new Date(log.loggedAt);
      return logDate >= startOfMonth && logDate <= endOfMonth;
    });

    if (monthLogs.length === 0) {
      return { avgSystolic: null, avgDiastolic: null, avgPulse: null, count: 0 };
    }

    const totalSys = monthLogs.reduce((acc, curr) => acc + curr.systolic, 0);
    const totalDia = monthLogs.reduce((acc, curr) => acc + curr.diastolic, 0);
    const pulseLogs = monthLogs.filter((l) => l.pulse !== undefined && l.pulse > 0);
    const totalPulse = pulseLogs.reduce((acc, curr) => acc + (curr.pulse || 0), 0);

    return {
      avgSystolic: Math.round(totalSys / monthLogs.length),
      avgDiastolic: Math.round(totalDia / monthLogs.length),
      avgPulse: pulseLogs.length > 0 ? Math.round(totalPulse / pulseLogs.length) : null,
      count: monthLogs.length,
    };
  }

  /**
   * Calculates today's average blood pressure.
   */
  calculateTodayAverage(
    logs: BloodPressureLog[],
    referenceDate: Date = new Date()
  ): BPAverageResult {
    const todayStr = referenceDate.toISOString().substring(0, 10);
    const todayLogs = logs.filter((log) => log.loggedAt.substring(0, 10) === todayStr);

    if (todayLogs.length === 0) {
      return { avgSystolic: null, avgDiastolic: null, avgPulse: null, count: 0 };
    }

    const totalSys = todayLogs.reduce((acc, curr) => acc + curr.systolic, 0);
    const totalDia = todayLogs.reduce((acc, curr) => acc + curr.diastolic, 0);
    const pulseLogs = todayLogs.filter((l) => l.pulse !== undefined && l.pulse > 0);
    const totalPulse = pulseLogs.reduce((acc, curr) => acc + (curr.pulse || 0), 0);

    return {
      avgSystolic: Math.round(totalSys / todayLogs.length),
      avgDiastolic: Math.round(totalDia / todayLogs.length),
      avgPulse: pulseLogs.length > 0 ? Math.round(totalPulse / pulseLogs.length) : null,
      count: todayLogs.length,
    };
  }

  // ----------------------------------------------------
  // BP Reminders & Alarms
  // ----------------------------------------------------

  async getBPReminders(): Promise<BPReminderConfig[]> {
    try {
      const db = getDatabase();
      const rows = await db.getAllAsync<{
        entity_id: string;
        trigger_time: string;
        title: string;
        status: string;
      }>(
        "SELECT entity_id, trigger_time, title, status FROM reminders WHERE entity_type = 'bp_reminder' ORDER BY trigger_time ASC;"
      );

      if (rows.length === 0) {
        for (const def of DEFAULT_BP_REMINDERS) {
          await this.saveBPReminder(def.id, def.reminderTime, def.enabled, def.label);
        }
        return DEFAULT_BP_REMINDERS;
      }

      return rows.map((r) => ({
        id: r.entity_id,
        label: r.title,
        reminderTime: r.trigger_time,
        enabled: r.status === 'active',
      }));
    } catch (e) {
      console.warn('Error fetching BP reminders from db:', e);
      return DEFAULT_BP_REMINDERS;
    }
  }

  async saveBPReminder(
    id: string,
    reminderTime: string,
    enabled: boolean,
    label?: string
  ): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const title = label || (id === 'morning' ? 'Morning Blood Pressure Check' : id === 'evening' ? 'Evening Blood Pressure Check' : 'Blood Pressure Check');
    const status = enabled ? 'active' : 'disabled';
    const reminderId = `bp_reminder_${id}`;

    await db.runAsync(
      `INSERT INTO reminders (id, entity_type, entity_id, notification_id, trigger_time, title, body, status, created_at, updated_at)
       VALUES (?, 'bp_reminder', ?, ?, ?, ?, 'Time to check and record your blood pressure.', ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         trigger_time = excluded.trigger_time,
         title = excluded.title,
         status = excluded.status,
         updated_at = excluded.updated_at;`,
      [
        reminderId,
        id,
        `bp_check_${id}`,
        reminderTime,
        title,
        status,
        now,
        now,
      ]
    );

    if (enabled) {
      try {
        await this.notifier.scheduleBPReminder({
          id,
          label: title,
          reminderTime,
        });
      } catch (err) {
        console.warn(`Failed to schedule BP reminder for ${id}:`, err);
      }
    } else {
      try {
        await this.notifier.cancelBPReminder(id);
      } catch (err) {
        console.warn(`Failed to cancel BP reminder for ${id}:`, err);
      }
    }
  }

  async addBPReminder(label: string, reminderTime: string): Promise<BPReminderConfig> {
    const id = `bp_custom_${Date.now()}`;
    await this.saveBPReminder(id, reminderTime, true, label);
    return {
      id,
      label,
      reminderTime,
      enabled: true,
    };
  }

  async deleteBPReminder(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync(
      "DELETE FROM reminders WHERE entity_type = 'bp_reminder' AND entity_id = ?;",
      [id]
    );
    try {
      await this.notifier.cancelBPReminder(id);
    } catch (e) {
      console.warn(`Failed to cancel BP reminder for ${id} on delete:`, e);
    }
  }

  async syncAllBPReminders(): Promise<void> {
    const configs = await this.getBPReminders();
    for (const cfg of configs) {
      if (cfg.enabled) {
        try {
          await this.notifier.scheduleBPReminder({
            id: cfg.id,
            label: cfg.label,
            reminderTime: cfg.reminderTime,
          });
        } catch (e) {
          console.warn('Error syncing BP reminder:', e);
        }
      }
    }
  }
}

export const bloodPressureService = new BloodPressureService();
