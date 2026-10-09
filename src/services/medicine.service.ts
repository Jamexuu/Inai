import {
  IMedicineLogRepository,
  IMedicineRepository,
  IMedicineScheduleRepository,
  MedicineLogRepository,
  MedicineRepository,
  MedicineScheduleRepository,
} from '@/repositories';
import { INotificationProvider, notificationProvider } from '@/notifications';
import { Medicine, MedicineDoseStatus, MedicineWithSchedules, TimeSlot, TodayMedicineDose } from '@/types';

export class MedicineService {
  constructor(
    private readonly medicineRepo: IMedicineRepository = new MedicineRepository(),
    private readonly scheduleRepo: IMedicineScheduleRepository = new MedicineScheduleRepository(),
    private readonly logRepo: IMedicineLogRepository = new MedicineLogRepository(),
    private readonly notifier: INotificationProvider = notificationProvider
  ) {}

  async getAllMedicines(): Promise<MedicineWithSchedules[]> {
    return this.medicineRepo.getAllWithSchedules(true);
  }

  async getTodayDoses(datePrefix?: string): Promise<TodayMedicineDose[]> {
    const prefix = datePrefix ?? new Date().toISOString().substring(0, 10);
    return this.logRepo.getTodayDoses(prefix);
  }

  async addMedicine(params: {
    name: string;
    dosage: string;
    instructions?: string;
    notes?: string;
    schedules: Array<{
      timeSlot: TimeSlot;
      reminderTime: string;
      daysOfWeek?: string;
    }>;
  }): Promise<MedicineWithSchedules> {
    const medicineId = `med_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const medicine = await this.medicineRepo.create({
      id: medicineId,
      name: params.name.trim(),
      dosage: params.dosage.trim(),
      instructions: params.instructions?.trim() || undefined,
      notes: params.notes?.trim() || undefined,
      isActive: true,
    });

    const createdSchedules = [];
    for (const s of params.schedules) {
      const scheduleId = `sch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const schedule = await this.scheduleRepo.create({
        id: scheduleId,
        medicineId,
        timeSlot: s.timeSlot,
        reminderTime: s.reminderTime,
        daysOfWeek: s.daysOfWeek ?? 'ALL',
        isActive: true,
      });
      createdSchedules.push(schedule);

      // Schedule local notification
      try {
        await this.notifier.scheduleMedicineReminder({
          medicineId,
          scheduleId: schedule.id,
          medicineName: medicine.name,
          dosage: medicine.dosage,
          instructions: medicine.instructions,
          timeSlot: schedule.timeSlot,
          reminderTime: schedule.reminderTime,
        });
      } catch (err) {
        console.warn('Failed to schedule reminder notification:', err);
      }
    }

    return {
      ...medicine,
      schedules: createdSchedules,
    };
  }

  async addScheduleToMedicine(params: {
    medicineId: string;
    timeSlot: TimeSlot;
    reminderTime: string;
    daysOfWeek?: string;
  }) {
    const medicine = await this.medicineRepo.getById(params.medicineId);
    if (!medicine) {
      throw new Error(`Medicine not found: ${params.medicineId}`);
    }

    const scheduleId = `sch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const schedule = await this.scheduleRepo.create({
      id: scheduleId,
      medicineId: params.medicineId,
      timeSlot: params.timeSlot,
      reminderTime: params.reminderTime,
      daysOfWeek: params.daysOfWeek ?? 'ALL',
      isActive: true,
    });

    try {
      await this.notifier.scheduleMedicineReminder({
        medicineId: medicine.id,
        scheduleId: schedule.id,
        medicineName: medicine.name,
        dosage: medicine.dosage,
        instructions: medicine.instructions,
        timeSlot: schedule.timeSlot,
        reminderTime: schedule.reminderTime,
      });
    } catch (err) {
      console.warn('Failed to schedule reminder notification:', err);
    }

    return schedule;
  }

  async updateMedicine(
    medicine: Medicine,
    newSchedules?: Array<{
      timeSlot: TimeSlot;
      reminderTime: string;
      daysOfWeek?: string;
    }>
  ): Promise<Medicine> {
    const updated = await this.medicineRepo.update(medicine);

    if (newSchedules && newSchedules.length > 0) {
      // Cancel previous notifications
      await this.notifier.cancelAllMedicineReminders(medicine.id);
      // Replace schedules
      await this.scheduleRepo.deleteByMedicineId(medicine.id);

      for (const s of newSchedules) {
        const scheduleId = `sch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const schedule = await this.scheduleRepo.create({
          id: scheduleId,
          medicineId: medicine.id,
          timeSlot: s.timeSlot,
          reminderTime: s.reminderTime,
          daysOfWeek: s.daysOfWeek ?? 'ALL',
          isActive: true,
        });

        // Reschedule notification
        try {
          await this.notifier.scheduleMedicineReminder({
            medicineId: medicine.id,
            scheduleId: schedule.id,
            medicineName: medicine.name,
            dosage: medicine.dosage,
            instructions: medicine.instructions,
            timeSlot: schedule.timeSlot,
            reminderTime: schedule.reminderTime,
          });
        } catch (err) {
          console.warn('Failed to reschedule reminder notification:', err);
        }
      }
    }

    return updated;
  }

  async deleteMedicine(medicineId: string): Promise<void> {
    // 1. Cancel notifications
    await this.notifier.cancelAllMedicineReminders(medicineId);
    // 2. Delete schedules & medicine from SQLite
    await this.scheduleRepo.deleteByMedicineId(medicineId);
    await this.medicineRepo.delete(medicineId);
  }

  async markDose(params: {
    medicineId: string;
    scheduleId?: string;
    scheduledTime: string;
    status: MedicineDoseStatus;
    notes?: string;
  }): Promise<void> {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    await this.logRepo.logDose({
      id: logId,
      medicineId: params.medicineId,
      scheduleId: params.scheduleId,
      scheduledTime: params.scheduledTime,
      status: params.status,
      notes: params.notes,
    });
  }

  async getRecentLogs(limit = 50) {
    return this.logRepo.getRecentLogs(limit);
  }
}

export const medicineService = new MedicineService();

