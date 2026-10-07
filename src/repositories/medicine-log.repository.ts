import { getDatabase } from '@/database/database';
import { MedicineDoseStatus, MedicineLog, TodayMedicineDose } from '@/types';

export interface IMedicineLogRepository {
  logDose(entry: {
    id: string;
    medicineId: string;
    scheduleId?: string;
    scheduledTime: string;
    status: MedicineDoseStatus;
    notes?: string;
  }): Promise<MedicineLog>;
  getTodayDoses(datePrefix: string): Promise<TodayMedicineDose[]>;
  getRecentLogs(limit?: number): Promise<MedicineLog[]>;
  deleteLog(id: string): Promise<void>;
}

export class MedicineLogRepository implements IMedicineLogRepository {
  async logDose(entry: {
    id: string;
    medicineId: string;
    scheduleId?: string;
    scheduledTime: string;
    status: MedicineDoseStatus;
    notes?: string;
  }): Promise<MedicineLog> {
    const db = getDatabase();
    const now = new Date().toISOString();

    // Check if an existing log exists for this schedule and scheduledTime date prefix
    const existing = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM medicine_logs 
       WHERE medicine_id = ? AND scheduled_time = ?;`,
      [entry.medicineId, entry.scheduledTime]
    );

    if (existing) {
      await db.runAsync(
        `UPDATE medicine_logs 
         SET status = ?, logged_at = ?, notes = ?
         WHERE id = ?;`,
        [entry.status, now, entry.notes ?? null, existing.id]
      );

      return {
        id: existing.id,
        medicineId: entry.medicineId,
        scheduleId: entry.scheduleId,
        scheduledTime: entry.scheduledTime,
        loggedAt: now,
        status: entry.status,
        notes: entry.notes,
        createdAt: now,
      };
    }

    await db.runAsync(
      `INSERT INTO medicine_logs (id, medicine_id, schedule_id, scheduled_time, logged_at, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        entry.id,
        entry.medicineId,
        entry.scheduleId ?? null,
        entry.scheduledTime,
        now,
        entry.status,
        entry.notes ?? null,
        now,
      ]
    );

    return {
      id: entry.id,
      medicineId: entry.medicineId,
      scheduleId: entry.scheduleId,
      scheduledTime: entry.scheduledTime,
      loggedAt: now,
      status: entry.status,
      notes: entry.notes,
      createdAt: now,
    };
  }

  async getTodayDoses(datePrefix: string): Promise<TodayMedicineDose[]> {
    const db = getDatabase();

    // Fetch active medicines with their active schedules
    const rows = await db.getAllAsync<{
      schedule_id: string;
      medicine_id: string;
      medicine_name: string;
      dosage: string;
      instructions: string | null;
      time_slot: string;
      reminder_time: string;
      log_id: string | null;
      log_status: string | null;
      log_time: string | null;
    }>(
      `SELECT 
        s.id AS schedule_id,
        m.id AS medicine_id,
        m.name AS medicine_name,
        m.dosage AS dosage,
        m.instructions AS instructions,
        s.time_slot AS time_slot,
        s.reminder_time AS reminder_time,
        l.id AS log_id,
        l.status AS log_status,
        l.logged_at AS log_time
       FROM medicine_schedules s
       JOIN medicines m ON s.medicine_id = m.id
       LEFT JOIN medicine_logs l ON l.schedule_id = s.id AND l.scheduled_time LIKE ?
       WHERE m.is_active = 1 AND s.is_active = 1
       ORDER BY s.reminder_time ASC;`,
      [`${datePrefix}%`]
    );

    return rows.map((r) => ({
      scheduleId: r.schedule_id,
      medicineId: r.medicine_id,
      medicineName: r.medicine_name,
      dosage: r.dosage,
      instructions: r.instructions ?? undefined,
      timeSlot: r.time_slot as any,
      reminderTime: r.reminder_time,
      status: (r.log_status as MedicineDoseStatus) ?? 'pending',
      loggedAt: r.log_time ?? undefined,
      logId: r.log_id ?? undefined,
    }));
  }

  async getRecentLogs(limit = 50): Promise<MedicineLog[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      medicine_id: string;
      schedule_id: string | null;
      scheduled_time: string;
      logged_at: string;
      status: string;
      notes: string | null;
      created_at: string;
    }>('SELECT * FROM medicine_logs ORDER BY logged_at DESC LIMIT ?;', [limit]);

    return rows.map((r) => ({
      id: r.id,
      medicineId: r.medicine_id,
      scheduleId: r.schedule_id ?? undefined,
      scheduledTime: r.scheduled_time,
      loggedAt: r.logged_at,
      status: r.status as MedicineDoseStatus,
      notes: r.notes ?? undefined,
      createdAt: r.created_at,
    }));
  }

  async deleteLog(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM medicine_logs WHERE id = ?;', [id]);
  }
}

