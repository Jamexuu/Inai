import { openDatabaseSync, SQLiteDatabase } from 'expo-sqlite';
import { DEFAULT_MEALS_SEED, SCHEMA_SQL } from './schema';

const DB_NAME = 'inai_mom_routine.db';

declare global {
  var __inai_db__: SQLiteDatabase | undefined;
  var __inai_init_promise__: Promise<SQLiteDatabase> | undefined;
}

/**
 * Gets the singleton SQLiteDatabase instance.
 * Preserves the instance on globalThis across Fast Refresh to prevent leaking native connections.
 */
export function getDatabase(): SQLiteDatabase {
  if (!globalThis.__inai_db__) {
    const db = openDatabaseSync(DB_NAME);
    try {
      // 1. Set busy timeout FIRST so any concurrent lock waits up to 5s instead of failing immediately
      db.execSync('PRAGMA busy_timeout = 5000;');
      // 2. Enable referential integrity
      db.execSync('PRAGMA foreign_keys = ON;');
    } catch (e) {
      console.warn('Failed to set SQLite timeout / foreign keys:', e);
    }

    try {
      // 3. Only set WAL mode if not already active
      const currentMode = db.getFirstSync<{ journal_mode: string }>('PRAGMA journal_mode;');
      if (currentMode?.journal_mode?.toLowerCase() !== 'wal') {
        db.execSync('PRAGMA journal_mode = WAL;');
      }
    } catch (e) {
      console.warn('Failed to configure SQLite journal_mode WAL:', e);
    }

    globalThis.__inai_db__ = db;
  }
  return globalThis.__inai_db__;
}

/**
 * Initializes the SQLite database schema and default seeds.
 * Preserves the in-flight Promise on globalThis across Fast Refresh so concurrent calls await the same execution.
 */
export function initializeDatabase(): Promise<SQLiteDatabase> {
  if (globalThis.__inai_init_promise__) {
    return globalThis.__inai_init_promise__;
  }

  globalThis.__inai_init_promise__ = (async () => {
    const db = getDatabase();

    try {
      await db.execAsync(SCHEMA_SQL);

      // Seed default meals if not present
      const existingMeals = await db.getAllAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM meals;'
      );

      if (existingMeals[0]?.count === 0) {
        const now = new Date().toISOString();
        await db.withTransactionAsync(async () => {
          for (const meal of DEFAULT_MEALS_SEED) {
            await db.runAsync(
              `INSERT INTO meals (id, meal_type, target_time, label, notes, is_active, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, 1, ?, ?);`,
              [meal.id, meal.meal_type, meal.target_time, meal.label, '', now, now]
            );
          }
        });
      }

      return db;
    } catch (error) {
      globalThis.__inai_init_promise__ = undefined;
      console.error('Error initializing SQLite database:', error);
      throw error;
    }
  })();

  return globalThis.__inai_init_promise__;
}
