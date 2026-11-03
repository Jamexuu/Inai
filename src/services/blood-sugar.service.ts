import {
  IBloodSugarRepository,
  BloodSugarRepository,
} from '@/repositories';
import { BloodSugarLog, BloodSugarContext } from '@/types';

export interface SugarAverageResult {
  average: number | null;
  count: number;
}

export class BloodSugarService {
  constructor(
    private readonly sugarRepo: IBloodSugarRepository = new BloodSugarRepository()
  ) {}

  async getAllLogs(): Promise<BloodSugarLog[]> {
    return this.sugarRepo.getAll();
  }

  async getLatestLog(): Promise<BloodSugarLog | null> {
    const logs = await this.sugarRepo.getAll();
    return logs[0] || null;
  }

  async addLog(params: {
    level: number;
    context: BloodSugarContext;
    loggedAt?: string;
    notes?: string;
  }): Promise<BloodSugarLog> {
    const id = `sugar_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const loggedAt = params.loggedAt || new Date().toISOString();

    return this.sugarRepo.create({
      id,
      level: Math.round(params.level),
      context: params.context,
      loggedAt,
      notes: params.notes?.trim() || undefined,
    });
  }

  async updateLog(log: BloodSugarLog): Promise<BloodSugarLog> {
    return this.sugarRepo.update(log);
  }

  async deleteLog(id: string): Promise<void> {
    return this.sugarRepo.delete(id);
  }

  // ----------------------------------------------------
  // Statistical Calculations (Weekly, Monthly, Yearly)
  // ----------------------------------------------------

  /**
   * Calculates the weekly average blood sugar for the week containing referenceDate (Mon-Sun).
   */
  calculateWeeklyAverage(
    logs: BloodSugarLog[],
    referenceDate: Date = new Date()
  ): SugarAverageResult {
    const ref = new Date(referenceDate);
    const day = ref.getDay(); // 0 is Sun, 1 is Mon
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const startOfWeek = new Date(ref);
    startOfWeek.setDate(ref.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const weekLogs = logs.filter((log) => {
      const logDate = new Date(log.loggedAt);
      return logDate >= startOfWeek && logDate <= endOfWeek;
    });

    if (weekLogs.length === 0) {
      return { average: null, count: 0 };
    }

    const total = weekLogs.reduce((acc, curr) => acc + curr.level, 0);
    return {
      average: Math.round(total / weekLogs.length),
      count: weekLogs.length,
    };
  }

  /**
   * Calculates the monthly average blood sugar for the month of referenceDate.
   */
  calculateMonthlyAverage(
    logs: BloodSugarLog[],
    referenceDate: Date = new Date()
  ): SugarAverageResult {
    const ref = new Date(referenceDate);
    const startOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthLogs = logs.filter((log) => {
      const logDate = new Date(log.loggedAt);
      return logDate >= startOfMonth && logDate <= endOfMonth;
    });

    if (monthLogs.length === 0) {
      return { average: null, count: 0 };
    }

    const total = monthLogs.reduce((acc, curr) => acc + curr.level, 0);
    return {
      average: Math.round(total / monthLogs.length),
      count: monthLogs.length,
    };
  }

  /**
   * Calculates the today average blood sugar.
   */
  calculateTodayAverage(
    logs: BloodSugarLog[],
    referenceDate: Date = new Date()
  ): SugarAverageResult {
    const todayStr = referenceDate.toISOString().substring(0, 10);
    const todayLogs = logs.filter((log) => log.loggedAt.substring(0, 10) === todayStr);

    if (todayLogs.length === 0) {
      return { average: null, count: 0 };
    }

    const total = todayLogs.reduce((acc, curr) => acc + curr.level, 0);
    return {
      average: Math.round(total / todayLogs.length),
      count: todayLogs.length,
    };
  }
}

export const bloodSugarService = new BloodSugarService();

