/**
 * SQLite Database Schema and Migrations for Inai
 * Offline-first persistent storage.
 */

export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

-- User Profile
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Medicines
CREATE TABLE IF NOT EXISTS medicines (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  instructions TEXT,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_medicines_active ON medicines(is_active);

-- Medicine Schedules
CREATE TABLE IF NOT EXISTS medicine_schedules (
  id TEXT PRIMARY KEY NOT NULL,
  medicine_id TEXT NOT NULL,
  time_slot TEXT NOT NULL,
  reminder_time TEXT NOT NULL,
  days_of_week TEXT NOT NULL DEFAULT 'ALL',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_schedules_med_id ON medicine_schedules(medicine_id);
CREATE INDEX IF NOT EXISTS idx_schedules_active ON medicine_schedules(is_active);

-- Medicine Intake Logs
CREATE TABLE IF NOT EXISTS medicine_logs (
  id TEXT PRIMARY KEY NOT NULL,
  medicine_id TEXT NOT NULL,
  schedule_id TEXT,
  scheduled_time TEXT NOT NULL,
  logged_at TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  FOREIGN KEY (schedule_id) REFERENCES medicine_schedules(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_logs_med_id ON medicine_logs(medicine_id);
CREATE INDEX IF NOT EXISTS idx_logs_scheduled_time ON medicine_logs(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_logs_logged_at ON medicine_logs(logged_at);

-- Daily Meals
CREATE TABLE IF NOT EXISTS meals (
  id TEXT PRIMARY KEY NOT NULL,
  meal_type TEXT NOT NULL,
  target_time TEXT NOT NULL,
  label TEXT NOT NULL,
  notes TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Meal Logs
CREATE TABLE IF NOT EXISTS meal_logs (
  id TEXT PRIMARY KEY NOT NULL,
  meal_id TEXT,
  meal_type TEXT NOT NULL,
  logged_at TEXT NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (meal_id) REFERENCES meals(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_meal_logs_logged_at ON meal_logs(logged_at);

-- Reminder Metadata
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  schedule_id TEXT,
  notification_id TEXT NOT NULL,
  trigger_time TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);

-- Blood Pressure Logs
CREATE TABLE IF NOT EXISTS blood_pressure_logs (
  id TEXT PRIMARY KEY NOT NULL,
  systolic INTEGER NOT NULL,
  diastolic INTEGER NOT NULL,
  pulse INTEGER,
  logged_at TEXT NOT NULL,
  notes TEXT,
  arm TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bp_logs_logged_at ON blood_pressure_logs(logged_at);

-- App Settings & Preferences
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export const DEFAULT_MEALS_SEED = [
  { id: 'meal_breakfast', meal_type: 'breakfast', target_time: '07:30', label: 'Breakfast' },
  { id: 'meal_lunch', meal_type: 'lunch', target_time: '12:30', label: 'Lunch' },
  { id: 'meal_dinner', meal_type: 'dinner', target_time: '18:30', label: 'Dinner' },
  { id: 'meal_snack', meal_type: 'snack', target_time: '15:30', label: 'Afternoon Snack' },
];

