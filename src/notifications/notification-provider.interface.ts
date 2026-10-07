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
}

