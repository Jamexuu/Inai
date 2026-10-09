import {
  IBloodPressureRepository,
  BloodPressureRepository,
} from '@/repositories';
import { BloodPressureLog } from '@/types';
import { INotificationProvider, notificationProvider } from '@/notifications';
import { getDatabase } from '@/database/database';

export interface BPReminderConfig {
  id: 'morning' | 'evening';
  label: string;
  reminderTime: string; // 24-hr format like "08:00" or "19:00"
  enabled: boolean;
}

const DEFAULT_BP_REMINDERS: BPReminderConfig[] = [
  { id: 'morning', label: 'Morning Blood Pressure Check', reminderTime: '08:00', enabled: true },
  { id: 'evening', label: 'Evening Blood Pressure Check', reminderTime: '19:00', enabled: true },
];

export class BloodPressureService {
  constructor(
    private readonly bpRepo: IBloodPressureRepository = new BloodPressureRepository(),
    private readonly notifier: INotificationProvider = notificationProvider
  ) {}

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
        "SELECT entity_id, trigger_time, title, status FROM reminders WHERE entity_type = 'bp_reminder';"
      );

      if (rows.length === 0) {
        for (const def of DEFAULT_BP_REMINDERS) {
          await this.saveBPReminder(def.id, def.reminderTime, def.enabled, def.label);
        }
        return DEFAULT_BP_REMINDERS;
      }

      return DEFAULT_BP_REMINDERS.map((def) => {
        const existing = rows.find((r) => r.entity_id === def.id);
        if (existing) {
          return {
            id: def.id,
            label: existing.title || def.label,
            reminderTime: existing.trigger_time || def.reminderTime,
            enabled: existing.status === 'active',
          };
        }
        return def;
      });
    } catch (e) {
      console.warn('Error fetching BP reminders from db:', e);
      return DEFAULT_BP_REMINDERS;
    }
  }

  async saveBPReminder(
    id: 'morning' | 'evening',
    reminderTime: string,
    enabled: boolean,
    label?: string
  ): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const title = label || (id === 'morning' ? 'Morning Blood Pressure Check' : 'Evening Blood Pressure Check');
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


