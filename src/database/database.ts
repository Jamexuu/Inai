import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_MEALS_SEED, SCHEMA_SQL } from './schema';

const DB_NAME = 'inai_mom_routine.db';

let dbInstance: SQLiteDatabase | null = null;
let isInitialized = false;

/**
 * Gets the singleton SQLiteDatabase instance.
 */
export function getDatabase(): SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = openDatabaseSync(DB_NAME);
  }
  return dbInstance;
}

/**
 * Initializes the SQLite database schema and default seeds.
 */
export async function initializeDatabase(): Promise<SQLiteDatabase> {
  const db = getDatabase();

  if (isInitialized) {
    return db;
  }

  try {
    await db.execAsync(SCHEMA_SQL);

    // Seed default meals if not present
    const existingMeals = await db.getAllAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM meals;'
    );

    if (existingMeals[0]?.count === 0) {
      const now = new Date().toISOString();
      for (const meal of DEFAULT_MEALS_SEED) {
        await db.runAsync(
          `INSERT INTO meals (id, meal_type, target_time, label, notes, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, 1, ?, ?);`,
          [meal.id, meal.meal_type, meal.target_time, meal.label, '', now, now]
        );
      }
    }

    isInitialized = true;
    return db;
  } catch (error) {
    console.error('Error initializing SQLite database:', error);
    throw error;
  }
}

