/**
 * Notification Provider Abstraction
 * Decouples business logic from concrete notification library.
 */

export interface MedicineReminderPayload {
  medicineId: string;
  scheduleId: string;
  medicineName: string;
  dosage: string;
  instructions?: string;
  timeSlot: string;
  reminderTime: string; // HH:mm format, e.g. "08:00"
}

export interface INotificationProvider {
  requestPermissions(): Promise<boolean>;
  scheduleMedicineReminder(reminder: MedicineReminderPayload): Promise<string>;
  cancelMedicineReminder(notificationId: string): Promise<void>;
  cancelAllMedicineReminders(medicineId: string): Promise<void>;
  rescheduleMedicineReminder(reminder: MedicineReminderPayload): Promise<string>;
  scheduleMealReminder(meal: { id: string; mealType: string; label: string; targetTime: string }): Promise<string>;
  cancelMealReminder(mealId: string): Promise<void>;
  scheduleBPReminder(params: { id: string; label: string; reminderTime: string }): Promise<string>;
  cancelBPReminder(id: string): Promise<void>;
  displayAlarmNow(medicineName?: string, dosage?: string): Promise<string>;
  triggerTestAlarm(medicineName?: string, delaySeconds?: number): Promise<string>;
  checkAlarmPermissions(): Promise<{ exactAlarmPermitted: boolean; notificationsPermitted: boolean }>;
  openAlarmSettings(): Promise<void>;
  openNotificationSettings(): Promise<void>;
}

