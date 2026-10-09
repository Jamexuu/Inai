import { getDatabase } from '@/database/database';
import { BloodPressureLog } from '@/types';

export interface IBloodPressureRepository {
  getAll(): Promise<BloodPressureLog[]>;
  getById(id: string): Promise<BloodPressureLog | null>;
  create(entry: Omit<BloodPressureLog, 'createdAt' | 'updatedAt'>): Promise<BloodPressureLog>;
  update(entry: BloodPressureLog): Promise<BloodPressureLog>;
  delete(id: string): Promise<void>;
}

export class BloodPressureRepository implements IBloodPressureRepository {
  async getAll(): Promise<BloodPressureLog[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      systolic: number;
      diastolic: number;
      pulse: number | null;
      logged_at: string;
      notes: string | null;
      arm: string | null;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM blood_pressure_logs ORDER BY logged_at DESC;');

    return rows.map((r) => ({
      id: r.id,
      systolic: r.systolic,
      diastolic: r.diastolic,
      pulse: r.pulse ?? undefined,
      loggedAt: r.logged_at,
      notes: r.notes ?? undefined,
      arm: (r.arm as 'left' | 'right') ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async getById(id: string): Promise<BloodPressureLog | null> {
    const db = getDatabase();
    const r = await db.getFirstAsync<{
      id: string;
      systolic: number;
      diastolic: number;
      pulse: number | null;
      logged_at: string;
      notes: string | null;
      arm: string | null;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM blood_pressure_logs WHERE id = ?;', [id]);

    if (!r) return null;

    return {
      id: r.id,
      systolic: r.systolic,
      diastolic: r.diastolic,
      pulse: r.pulse ?? undefined,
      loggedAt: r.logged_at,
      notes: r.notes ?? undefined,
      arm: (r.arm as 'left' | 'right') ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async create(entry: Omit<BloodPressureLog, 'createdAt' | 'updatedAt'>): Promise<BloodPressureLog> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO blood_pressure_logs (id, systolic, diastolic, pulse, logged_at, notes, arm, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        entry.id,
        entry.systolic,
        entry.diastolic,
        entry.pulse ?? null,
        entry.loggedAt,
        entry.notes ?? null,
        entry.arm ?? null,
        now,
        now,
      ]
    );

    return {
      ...entry,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(entry: BloodPressureLog): Promise<BloodPressureLog> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE blood_pressure_logs
       SET systolic = ?, diastolic = ?, pulse = ?, logged_at = ?, notes = ?, arm = ?, updated_at = ?
       WHERE id = ?;`,
      [
        entry.systolic,
        entry.diastolic,
        entry.pulse ?? null,
        entry.loggedAt,
        entry.notes ?? null,
        entry.arm ?? null,
        now,
        entry.id,
      ]
    );

    return {
      ...entry,
      updatedAt: now,
    };
  }

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    await db.runAsync('DELETE FROM blood_pressure_logs WHERE id = ?;', [id]);
  }
}

