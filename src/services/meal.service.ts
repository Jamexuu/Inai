import {
  IMealLogRepository,
  IMealRepository,
  MealLogRepository,
  MealRepository,
} from '@/repositories';
import { Meal, MealLog, MealStatus, MealType, TodayMealDose } from '@/types';
import { INotificationProvider, notificationProvider } from '@/notifications';

export class MealService {
  constructor(
    private readonly mealRepo: IMealRepository = new MealRepository(),
    private readonly mealLogRepo: IMealLogRepository = new MealLogRepository(),
    private readonly notifier: INotificationProvider = notificationProvider
  ) {}

  async getAllMeals(): Promise<Meal[]> {
    return this.mealRepo.getAll();
  }

  async getTodayMeals(datePrefix?: string): Promise<TodayMealDose[]> {
    const prefix = datePrefix ?? new Date().toISOString().substring(0, 10);
    return this.mealLogRepo.getTodayMeals(prefix);
  }

  async markMeal(params: {
    mealType: MealType;
    status: MealStatus;
    mealId?: string;
    notes?: string;
  }): Promise<MealLog> {
    const logId = `meal_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return this.mealLogRepo.logMeal({
      id: logId,
      mealId: params.mealId,
      mealType: params.mealType,
      status: params.status,
      notes: params.notes,
    });
  }

  async getRecentLogs(limit = 30): Promise<MealLog[]> {
    return this.mealLogRepo.getRecentLogs(limit);
  }

  async addMeal(params: {
    mealType: MealType;
    targetTime: string;
    label: string;
    notes?: string;
  }): Promise<Meal> {
    const mealId = `meal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const created = await this.mealRepo.create({
      id: mealId,
      mealType: params.mealType,
      targetTime: params.targetTime,
      label: params.label.trim(),
      notes: params.notes?.trim() || undefined,
      isActive: true,
    });

    try {
      await this.notifier.scheduleMealReminder({
        id: created.id,
        mealType: created.mealType,
        label: created.label,
        targetTime: created.targetTime,
      });
    } catch (e) {
      console.warn('Failed to schedule meal reminder:', e);
    }

    return created;
  }

  async updateMeal(meal: Meal): Promise<Meal> {
    const updated = await this.mealRepo.update(meal);

    try {
      await this.notifier.cancelMealReminder(meal.id);
      if (meal.isActive) {
        await this.notifier.scheduleMealReminder({
          id: meal.id,
          mealType: meal.mealType,
          label: meal.label,
          targetTime: meal.targetTime,
        });
      }
    } catch (e) {
      console.warn('Failed to reschedule meal reminder:', e);
    }

    return updated;
  }

  async deleteMeal(mealId: string): Promise<void> {
    try {
      await this.notifier.cancelMealReminder(mealId);
    } catch (e) {
      console.warn('Failed to cancel meal reminder:', e);
    }
    return this.mealRepo.delete(mealId);
  }

  async syncAllMealReminders(): Promise<void> {
    const meals = await this.mealRepo.getAll();
    for (const m of meals) {
      if (m.isActive) {
        try {
          await this.notifier.scheduleMealReminder({
            id: m.id,
            mealType: m.mealType,
            label: m.label,
            targetTime: m.targetTime,
          });
        } catch (e) {
          console.warn('Error syncing meal reminder:', e);
        }
      }
    }
  }
}

export const mealService = new MealService();
