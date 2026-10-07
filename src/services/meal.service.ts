import {
  IMealLogRepository,
  IMealRepository,
  MealLogRepository,
  MealRepository,
} from '@/repositories';
import { Meal, MealLog, MealStatus, MealType, TodayMealDose } from '@/types';

export class MealService {
  constructor(
    private readonly mealRepo: IMealRepository = new MealRepository(),
    private readonly mealLogRepo: IMealLogRepository = new MealLogRepository()
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
}

export const mealService = new MealService();

