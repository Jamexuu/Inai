/**
 * Core Domain Types for Inai
 * Offline-first maintenance medicine and meal tracker for Mom.
 */

export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'bedtime';

export type MedicineDoseStatus = 'pending' | 'taken' | 'skipped' | 'missed';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type MealStatus = 'pending' | 'completed' | 'skipped';

export interface UserProfile {
  id: string;
  name: string;
  nickname?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  dosage: string; // e.g. "500 mg", "1 tablet"
  instructions?: string; // e.g. "Take after meal", "Take with water"
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineSchedule {
  id: string;
  medicineId: string;
  timeSlot: TimeSlot;
  reminderTime: string; // HH:mm format, e.g. "08:00"
  daysOfWeek: string; // e.g. "ALL" or "1,2,3,4,5,6,7"
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MedicineWithSchedules extends Medicine {
  schedules: MedicineSchedule[];
}

export interface MedicineLog {
  id: string;
  medicineId: string;
  scheduleId?: string;
  scheduledTime: string; // ISO date-time or HH:mm for the day
  loggedAt: string; // ISO timestamp
  status: MedicineDoseStatus;
  notes?: string;
  createdAt: string;
}

export interface TodayMedicineDose {
  scheduleId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  instructions?: string;
  timeSlot: TimeSlot;
  reminderTime: string;
  status: MedicineDoseStatus;
  loggedAt?: string;
  logId?: string;
}

export interface Meal {
  id: string;
  mealType: MealType;
  targetTime: string; // HH:mm format, e.g. "07:30"
  label: string; // e.g. "Breakfast"
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MealLog {
  id: string;
  mealId?: string;
  mealType: MealType;
  loggedAt: string; // ISO timestamp
  status: MealStatus;
  notes?: string;
  createdAt: string;
}

export interface TodayMealDose {
  mealId?: string;
  mealType: MealType;
  label: string;
  targetTime: string;
  status: MealStatus;
  loggedAt?: string;
  logId?: string;
}

export interface ReminderMetadata {
  id: string;
  entityType: 'medicine' | 'meal';
  entityId: string;
  scheduleId?: string;
  notificationId: string;
  triggerTime: string;
  title: string;
  body: string;
  status: 'active' | 'cancelled' | 'delivered';
  createdAt: string;
  updatedAt: string;
}

