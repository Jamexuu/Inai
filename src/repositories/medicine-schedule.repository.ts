import { getDatabase } from '@/database/database';
import { MedicineSchedule } from '@/types';

export interface IMedicineScheduleRepository {
  getByMedicineId(medicineId: string): Promise<MedicineSchedule[]>;
  getAllActive(): Promise<MedicineSchedule[]>;
  create(schedule: Omit<MedicineSchedule, 'createdAt' | 'updatedAt'>): Promise<MedicineSchedule>;
  deleteByMedicineId(medicineId: string): Promise<void>;
  delete(id: string): Promise<void>;
}

export class MedicineScheduleRepository implements IMedicineScheduleRepository {
  async getByMedicineId(medicineId: string): Promise<MedicineSchedule[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      medicine_id: string;
      time_slot: string;
      reminder_time: string;
      days_of_week: string;
      is_active: number;
      created_at: string;
      updated_at: string;
    }>(
      'SELECT * FROM medicine_schedules WHERE medicine_id = ? AND is_active = 1 ORDER BY reminder_time ASC;',
      [medicineId]
    );

    return rows.map((r) => ({
      id: r.id,
      medicineId: r.medicine_id,
      timeSlot: r.time_slot as any,
      reminderTime: r.reminder_time,
      daysOfWeek: r.days_of_week,
      isActive: r.is_active === 1,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async getAllActive(): Promise<MedicineSchedule[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      medicine_id: string;
      time_slot: string;
      reminder_time: string;
      days_of_week: string;
      is_active: number;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM medicine_schedules WHERE is_active = 1 ORDER BY reminder_time ASC;');

    return rows.map((r) => ({
      id: r.id,
      medicineId: r.medicine_id,
      timeSlot: r.time_slot as any,
      reminderTime: r.reminder_time,
      daysOfWeek: r.days_of_week,
      isActive: r.is_active === 1,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async create(
    schedule: Omit<MedicineSchedule, 'createdAt' | 'updatedAt'>
  ): Promise<MedicineSchedule> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO medicine_schedules (id, medicine_id, time_slot, reminder_time, days_of_week, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        schedule.id,
        schedule.medicineId,
        schedule.timeSlot,
        schedule.reminderTime,
        schedule.daysOfWeek,
        schedule.isActive ? 1 : 0,
        now,
        now,
      ]
    );

    return {
      ...schedule,
      createdAt: now,
      updatedAt: now,
    };
  }

  async deleteByMedicineId(medicineId: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM medicine_schedules WHERE medicine_id = ?;', [medicineId]);
  }

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM medicine_schedules WHERE id = ?;', [id]);
  }
}

