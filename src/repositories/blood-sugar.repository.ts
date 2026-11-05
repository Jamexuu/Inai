import { getDatabase } from '@/database/database';
import { BloodSugarLog, BloodSugarContext } from '@/types';

export interface IBloodSugarRepository {
  getAll(): Promise<BloodSugarLog[]>;
  getByDate?(datePrefix: string): Promise<BloodSugarLog[]>;
  getById(id: string): Promise<BloodSugarLog | null>;
  create(entry: Omit<BloodSugarLog, 'createdAt' | 'updatedAt'>): Promise<BloodSugarLog>;
  update(entry: BloodSugarLog): Promise<BloodSugarLog>;
  delete(id: string): Promise<void>;
}

export class BloodSugarRepository implements IBloodSugarRepository {
  async getAll(): Promise<BloodSugarLog[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      level: number;
      context: string;
      logged_at: string;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM blood_sugar_logs ORDER BY logged_at DESC;');

    return rows.map((r) => ({
      id: r.id,
      level: r.level,
      context: (r.context as BloodSugarContext) || 'random',
      loggedAt: r.logged_at,
      notes: r.notes ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async getByDate(datePrefix: string): Promise<BloodSugarLog[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      level: number;
      context: string;
      logged_at: string;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM blood_sugar_logs WHERE logged_at LIKE ? ORDER BY logged_at ASC;', [
      `${datePrefix}%`,
    ]);

    return rows.map((r) => ({
      id: r.id,
      level: r.level,
      context: (r.context as BloodSugarContext) || 'random',
      loggedAt: r.logged_at,
      notes: r.notes ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async getById(id: string): Promise<BloodSugarLog | null> {
    const db = getDatabase();
    const r = await db.getFirstAsync<{
      id: string;
      level: number;
      context: string;
      logged_at: string;
      notes: string | null;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM blood_sugar_logs WHERE id = ?;', [id]);

    if (!r) return null;

    return {
      id: r.id,
      level: r.level,
      context: (r.context as BloodSugarContext) || 'random',
      loggedAt: r.logged_at,
      notes: r.notes ?? undefined,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async create(entry: Omit<BloodSugarLog, 'createdAt' | 'updatedAt'>): Promise<BloodSugarLog> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO blood_sugar_logs (id, level, context, logged_at, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        entry.id,
        entry.level,
        entry.context,
        entry.loggedAt,
        entry.notes ?? null,
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

  async update(entry: BloodSugarLog): Promise<BloodSugarLog> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE blood_sugar_logs
       SET level = ?, context = ?, logged_at = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,
      [
        entry.level,
        entry.context,
        entry.loggedAt,
        entry.notes ?? null,
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
    await db.runAsync('DELETE FROM blood_sugar_logs WHERE id = ?;', [id]);
  }
}

