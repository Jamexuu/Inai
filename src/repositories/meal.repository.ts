import { getDatabase } from '@/database/database';
import { Meal, MealLog, MealStatus, MealType, TodayMealDose } from '@/types';

export interface IMealRepository {
  getAll(): Promise<Meal[]>;
  getById(id: string): Promise<Meal | null>;
  create(meal: Omit<Meal, 'createdAt' | 'updatedAt'>): Promise<Meal>;
  update(meal: Meal): Promise<Meal>;
  delete(id: string): Promise<void>;
}

export class MealRepository implements IMealRepository {
  async getAll(): Promise<Meal[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      meal_type: string;
      target_time: string;
      label: string;
      notes: string | null;
      is_active: number;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM meals WHERE is_active = 1 ORDER BY target_time ASC;');

    return rows.map((r) => ({
      id: r.id,
      mealType: r.meal_type as MealType,
      targetTime: r.target_time,
      label: r.label,
      notes: r.notes ?? undefined,
      isActive: r.is_active === 1,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async getById(id: string): Promise<Meal | null> {
    const db = getDatabase();
    const r = await db.getFirstAsync<{
      id: string;
      meal_type: string;
      target_time: string;
      label: string;
      notes: string | null;
      is_active: number;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM meals WHERE id = ?;', [id]);

    if (!r) return null;

    return {
      id: r.id,
      mealType: r.meal_type as MealType,
      targetTime: r.target_time,
      label: r.label,
      notes: r.notes ?? undefined,
      isActive: r.is_active === 1,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  async create(meal: Omit<Meal, 'createdAt' | 'updatedAt'>): Promise<Meal> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO meals (id, meal_type, target_time, label, notes, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        meal.id,
        meal.mealType,
        meal.targetTime,
        meal.label,
        meal.notes ?? null,
        meal.isActive ? 1 : 0,
        now,
        now,
      ]
    );

    return {
      ...meal,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(meal: Meal): Promise<Meal> {
    const db = getDatabase();
    const now = new Date().toISOString();

    await db.runAsync(
      `UPDATE meals 
       SET meal_type = ?, target_time = ?, label = ?, notes = ?, is_active = ?, updated_at = ?
       WHERE id = ?;`,
      [meal.mealType, meal.targetTime, meal.label, meal.notes ?? null, meal.isActive ? 1 : 0, now, meal.id]
    );

    return { ...meal, updatedAt: now };
  }

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    // Soft delete so historical logs still link
    await db.runAsync('UPDATE meals SET is_active = 0 WHERE id = ?;', [id]);
  }
}

export interface IMealLogRepository {
  logMeal(entry: {
    id: string;
    mealId?: string;
    mealType: MealType;
    status: MealStatus;
    notes?: string;
  }): Promise<MealLog>;
  getTodayMeals(datePrefix: string): Promise<TodayMealDose[]>;
  getRecentLogs(limit?: number): Promise<MealLog[]>;
}

export class MealLogRepository implements IMealLogRepository {
  async logMeal(entry: {
    id: string;
    mealId?: string;
    mealType: MealType;
    status: MealStatus;
    notes?: string;
  }): Promise<MealLog> {
    const db = getDatabase();
    const now = new Date().toISOString();
    const todayPrefix = now.substring(0, 10);

    // Look for existing meal log today
    const existing = await db.getFirstAsync<{ id: string }>(
      `SELECT id FROM meal_logs 
       WHERE meal_type = ? AND logged_at LIKE ?;`,
      [entry.mealType, `${todayPrefix}%`]
    );

    if (existing) {
      await db.runAsync(
        `UPDATE meal_logs
         SET status = ?, logged_at = ?, notes = ?
         WHERE id = ?;`,
        [entry.status, now, entry.notes ?? null, existing.id]
      );

      return {
        id: existing.id,
        mealId: entry.mealId,
        mealType: entry.mealType,
        loggedAt: now,
        status: entry.status,
        notes: entry.notes,
        createdAt: now,
      };
    }

    await db.runAsync(
      `INSERT INTO meal_logs (id, meal_id, meal_type, logged_at, status, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [entry.id, entry.mealId ?? null, entry.mealType, now, entry.status, entry.notes ?? null, now]
    );

    return {
      id: entry.id,
      mealId: entry.mealId,
      mealType: entry.mealType,
      loggedAt: now,
      status: entry.status,
      notes: entry.notes,
      createdAt: now,
    };
  }

  async getTodayMeals(datePrefix: string): Promise<TodayMealDose[]> {
    const db = getDatabase();

    const rows = await db.getAllAsync<{
      id: string;
      meal_type: string;
      target_time: string;
      label: string;
      log_id: string | null;
      log_status: string | null;
      logged_at: string | null;
    }>(
      `SELECT 
        m.id,
        m.meal_type,
        m.target_time,
        m.label,
        l.id AS log_id,
        l.status AS log_status,
        l.logged_at
       FROM meals m
       LEFT JOIN meal_logs l ON l.meal_type = m.meal_type AND l.logged_at LIKE ?
       WHERE m.is_active = 1
       ORDER BY m.target_time ASC;`,
      [`${datePrefix}%`]
    );

    return rows.map((r) => ({
      mealId: r.id,
      mealType: r.meal_type as MealType,
      label: r.label,
      targetTime: r.target_time,
      status: (r.log_status as MealStatus) ?? 'pending',
      loggedAt: r.logged_at ?? undefined,
      logId: r.log_id ?? undefined,
    }));
  }

  async getRecentLogs(limit = 30): Promise<MealLog[]> {
    const db = getDatabase();
    const rows = await db.getAllAsync<{
      id: string;
      meal_id: string | null;
      meal_type: string;
      logged_at: string;
      status: string;
      notes: string | null;
      created_at: string;
    }>('SELECT * FROM meal_logs ORDER BY logged_at DESC LIMIT ?;', [limit]);

    return rows.map((r) => ({
      id: r.id,
      mealId: r.meal_id ?? undefined,
      mealType: r.meal_type as MealType,
      loggedAt: r.logged_at,
      status: r.status as MealStatus,
      notes: r.notes ?? undefined,
      createdAt: r.created_at,
    }));
  }
}

