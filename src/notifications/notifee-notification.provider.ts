import notifee, {
  AndroidImportance,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { INotificationProvider, MedicineReminderPayload } from './notification-provider.interface';

const CHANNEL_ID = 'inai_medicine_reminders';
const CHANNEL_NAME = 'Medicine Reminders';

export class NotifeeNotificationProvider implements INotificationProvider {
  private channelCreated = false;

  private async ensureChannel(): Promise<void> {
    if (this.channelCreated || Platform.OS !== 'android') return;

    try {
      await notifee.createChannel({
        id: CHANNEL_ID,
        name: CHANNEL_NAME,
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
      });
      this.channelCreated = true;
    } catch (e) {
      console.warn('Failed to create Android notification channel:', e);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const settings = await notifee.requestPermission();
      return settings.authorizationStatus >= 1;
    } catch (error) {
      console.warn('Notification permission request error:', error);
      return false;
    }
  }

  async scheduleMedicineReminder(reminder: MedicineReminderPayload): Promise<string> {
    await this.ensureChannel();

    const [hourStr, minuteStr] = reminder.reminderTime.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(hour, minute, 0, 0);

    // If the time already passed today, schedule for tomorrow
    if (triggerDate.getTime() <= now.getTime()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
    };

    const notificationId = `med_${reminder.medicineId}_${reminder.scheduleId}`;

    const subtitleText = `${reminder.dosage}${reminder.instructions ? ` • ${reminder.instructions}` : ''}`;

    await notifee.createTriggerNotification(
      {
        id: notificationId,
        title: 'Medicine Reminder',
        body: `Time to take ${reminder.medicineName} (${subtitleText})`,
        data: {
          medicineId: reminder.medicineId,
          scheduleId: reminder.scheduleId,
        },
        android: {
          channelId: CHANNEL_ID,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
          },
        },
        ios: {
          sound: 'default',
        },
      },
      trigger
    );

    return notificationId;
  }

  async cancelMedicineReminder(notificationId: string): Promise<void> {
    try {
      await notifee.cancelNotification(notificationId);
      await notifee.cancelTriggerNotification(notificationId);
    } catch (e) {
      console.warn(`Failed to cancel notification ${notificationId}:`, e);
    }
  }

  async cancelAllMedicineReminders(medicineId: string): Promise<void> {
    try {
      const triggerIds = await notifee.getTriggerNotificationIds();
      for (const id of triggerIds) {
        if (id.startsWith(`med_${medicineId}_`)) {
          await notifee.cancelNotification(id);
          await notifee.cancelTriggerNotification(id);
        }
      }
    } catch (e) {
      console.warn(`Failed to cancel notifications for med ${medicineId}:`, e);
    }
  }

  async rescheduleMedicineReminder(reminder: MedicineReminderPayload): Promise<string> {
    const notificationId = `med_${reminder.medicineId}_${reminder.scheduleId}`;
    await this.cancelMedicineReminder(notificationId);
    return this.scheduleMedicineReminder(reminder);
  }
}

