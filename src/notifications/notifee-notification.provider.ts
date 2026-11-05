import notifee, {
  AndroidCategory,
  AndroidImportance,
  AlarmType,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { Platform } from 'react-native';
import { INotificationProvider, MedicineReminderPayload } from './notification-provider.interface';
import { parseTo24Hour } from '@/utils/date.utils';

export const MEDICINE_CHANNEL_ID = 'inai_medicine_reminders';
export const MEDICINE_CHANNEL_NAME = 'Medicine Reminders';

export const MEAL_CHANNEL_ID = 'inai_meal_reminders';
export const MEAL_CHANNEL_NAME = 'Meal Reminders';

export const BP_CHANNEL_ID = 'inai_bp_reminders';
export const BP_CHANNEL_NAME = 'Blood Pressure Reminders';

export const SUGAR_CHANNEL_ID = 'inai_sugar_reminders';
export const SUGAR_CHANNEL_NAME = 'Blood Sugar Reminders';

// Compatibility alias
export const ALARM_CHANNEL_ID = MEDICINE_CHANNEL_ID;
export const ALARM_CHANNEL_NAME = MEDICINE_CHANNEL_NAME;

export class NotifeeNotificationProvider implements INotificationProvider {
  private channelsCreated = false;

  private async ensureChannels(): Promise<void> {
    if (this.channelsCreated || Platform.OS !== 'android') return;

    try {
      // 1. Medicine Reminder Channel (Standard notification banner, single chime, gentle vibration)
      await notifee.createChannel({
        id: MEDICINE_CHANNEL_ID,
        name: MEDICINE_CHANNEL_NAME,
        description: 'Gentle daily reminders for medicine intake with action buttons',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [250, 250],
        bypassDnd: false,
      });

      // 2. Meal Reminder Channel
      await notifee.createChannel({
        id: MEAL_CHANNEL_ID,
        name: MEAL_CHANNEL_NAME,
        description: 'Gentle reminders for daily meal routines',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [250, 250],
        bypassDnd: false,
      });

      // 3. Blood Pressure Reminder Channel
      await notifee.createChannel({
        id: BP_CHANNEL_ID,
        name: BP_CHANNEL_NAME,
        description: 'Gentle reminders to check and record daily blood pressure',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [250, 250],
        bypassDnd: false,
      });

      // 4. Blood Sugar Reminder Channel
      await notifee.createChannel({
        id: SUGAR_CHANNEL_ID,
        name: SUGAR_CHANNEL_NAME,
        description: 'Gentle prompts to test and record daily blood sugar levels',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [250, 250],
        bypassDnd: false,
      });

      this.channelsCreated = true;
    } catch (e) {
      console.warn('Failed to create Android notification channels:', e);
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

  // ----------------------------------------------------
  // MEDICINE REMINDERS
  // ----------------------------------------------------

  async scheduleMedicineReminder(reminder: MedicineReminderPayload): Promise<string> {
    await this.ensureChannels();

    const canonicalTime = parseTo24Hour(reminder.reminderTime);
    const [hourStr, minuteStr] = canonicalTime.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(hour, minute, 0, 0);

    // If the time already passed today, schedule for tomorrow
    if (triggerDate.getTime() <= now.getTime()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    // Schedule exact wake-up for offline reliability
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
      alarmManager: {
        type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
      },
    };

    const notificationId = `med_${reminder.medicineId}_${reminder.scheduleId}`;
    const subtitleText = `${reminder.dosage}${reminder.instructions ? ` • ${reminder.instructions}` : ''}`;

    const notificationPayload = {
      id: notificationId,
      title: `Medicine Reminder: ${reminder.medicineName}`,
      body: `${subtitleText}\nTime to take your scheduled dose.`,
      data: {
        medicineId: reminder.medicineId,
        scheduleId: reminder.scheduleId,
        medicineName: reminder.medicineName,
        dosage: reminder.dosage,
        reminderTime: reminder.reminderTime,
      },
      android: {
        channelId: MEDICINE_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.REMINDER,
        loopSound: false,
        ongoing: false,
        autoCancel: true,
        pressAction: {
          id: 'default',
        },
        actions: [
          {
            title: 'Mark as Taken',
            pressAction: {
              id: 'mark_taken',
            },
          },
          {
            title: 'Remind in 10m',
            pressAction: {
              id: 'snooze_10',
            },
          },
        ],
      },
      ios: {
        sound: 'default',
        critical: false,
      },
    };

    try {
      await notifee.createTriggerNotification(notificationPayload, trigger);
    } catch (err) {
      console.warn('AlarmManager exact trigger failed, falling back to standard trigger:', err);
      await notifee.createTriggerNotification(notificationPayload, {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      });
    }

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

  // ----------------------------------------------------
  // MEAL REMINDERS
  // ----------------------------------------------------

  async scheduleMealReminder(meal: {
    id: string;
    mealType: string;
    label: string;
    targetTime: string;
  }): Promise<string> {
    await this.ensureChannels();

    const canonicalTime = parseTo24Hour(meal.targetTime);
    const [hourStr, minuteStr] = canonicalTime.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(hour, minute, 0, 0);

    if (triggerDate.getTime() <= now.getTime()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
      alarmManager: {
        type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
      },
    };

    const notificationId = `meal_${meal.id}`;

    const notificationPayload = {
      id: notificationId,
      title: `Meal Reminder: ${meal.label}`,
      body: `Time for a calm, healthy meal. Maintain your daily eating routine.`,
      data: {
        type: 'meal',
        mealId: meal.id,
        mealType: meal.mealType,
      },
      android: {
        channelId: MEAL_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.REMINDER,
        loopSound: false,
        ongoing: false,
        autoCancel: true,
        pressAction: {
          id: 'default',
        },
        actions: [
          {
            title: 'Mark as Done',
            pressAction: {
              id: 'mark_meal_done',
            },
          },
          {
            title: 'Remind in 10m',
            pressAction: {
              id: 'snooze_10',
            },
          },
        ],
      },
      ios: {
        sound: 'default',
        critical: false,
      },
    };

    try {
      await notifee.createTriggerNotification(notificationPayload, trigger);
    } catch (err) {
      console.warn('Meal reminder trigger failed, using standard trigger:', err);
      await notifee.createTriggerNotification(notificationPayload, {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      });
    }

    return notificationId;
  }

  async cancelMealReminder(mealId: string): Promise<void> {
    const id = `meal_${mealId}`;
    try {
      await notifee.cancelNotification(id);
      await notifee.cancelTriggerNotification(id);
    } catch (e) {
      console.warn(`Failed to cancel meal reminder ${id}:`, e);
    }
  }

  // ----------------------------------------------------
  // BLOOD PRESSURE REMINDERS
  // ----------------------------------------------------

  async scheduleBPReminder(params: {
    id: string; // e.g. 'morning' or 'evening'
    label: string; // e.g. 'Morning Blood Pressure Check'
    reminderTime: string; // e.g. '8:00 AM'
  }): Promise<string> {
    await this.ensureChannels();

    const canonicalTime = parseTo24Hour(params.reminderTime);
    const [hourStr, minuteStr] = canonicalTime.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(hour, minute, 0, 0);

    if (triggerDate.getTime() <= now.getTime()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
      alarmManager: {
        type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
      },
    };

    const notificationId = `bp_check_${params.id}`;

    const notificationPayload = {
      id: notificationId,
      title: `Blood Pressure Reminder: ${params.label}`,
      body: `Rest quietly for 5 minutes, then take and log your reading.`,
      data: {
        type: 'bp',
        slot: params.id,
      },
      android: {
        channelId: BP_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.REMINDER,
        loopSound: false,
        ongoing: false,
        autoCancel: true,
        pressAction: {
          id: 'default',
        },
        actions: [
          {
            title: 'Log Blood Pressure',
            pressAction: {
              id: 'open_bp_log',
              launchActivity: 'default',
            },
          },
          {
            title: 'Remind in 10m',
            pressAction: {
              id: 'snooze_10',
            },
          },
        ],
      },
      ios: {
        sound: 'default',
        critical: false,
      },
    };

    try {
      await notifee.createTriggerNotification(notificationPayload, trigger);
    } catch (err) {
      console.warn('BP reminder trigger failed, using standard trigger:', err);
      await notifee.createTriggerNotification(notificationPayload, {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      });
    }

    return notificationId;
  }

  async cancelBPReminder(id: string): Promise<void> {
    const notificationId = `bp_check_${id}`;
    try {
      await notifee.cancelNotification(notificationId);
      await notifee.cancelTriggerNotification(notificationId);
    } catch (e) {
      console.warn(`Failed to cancel BP reminder ${notificationId}:`, e);
    }
  }

  async scheduleSugarReminder(params: {
    id: string;
    label: string;
    reminderTime: string;
  }): Promise<string> {
    await this.ensureChannels();

    const canonicalTime = parseTo24Hour(params.reminderTime);
    const [hourStr, minuteStr] = canonicalTime.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    const now = new Date();
    const triggerDate = new Date();
    triggerDate.setHours(hour, minute, 0, 0);

    if (triggerDate.getTime() <= now.getTime()) {
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerDate.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
      alarmManager: {
        type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
      },
    };

    const notificationId = `sugar_check_${params.id}`;

    const notificationPayload = {
      id: notificationId,
      title: `Blood Sugar Reminder: ${params.label}`,
      body: `Time to check and record your glucose level.`,
      data: {
        type: 'sugar',
        slot: params.id,
      },
      android: {
        channelId: SUGAR_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.REMINDER,
        loopSound: false,
        ongoing: false,
        autoCancel: true,
        pressAction: {
          id: 'default',
        },
        actions: [
          {
            title: 'Log Blood Sugar',
            pressAction: {
              id: 'open_sugar_log',
              launchActivity: 'default',
            },
          },
          {
            title: 'Remind in 10m',
            pressAction: {
              id: 'snooze_10',
            },
          },
        ],
      },
      ios: {
        sound: 'default',
        critical: false,
      },
    };

    try {
      await notifee.createTriggerNotification(notificationPayload, trigger);
    } catch (err) {
      console.warn('Sugar reminder trigger failed, using standard trigger:', err);
      await notifee.createTriggerNotification(notificationPayload, {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
        repeatFrequency: RepeatFrequency.DAILY,
      });
    }

    return notificationId;
  }

  async cancelSugarReminder(id: string): Promise<void> {
    const notificationId = `sugar_check_${id}`;
    try {
      await notifee.cancelNotification(notificationId);
      await notifee.cancelTriggerNotification(notificationId);
    } catch (e) {
      console.warn(`Failed to cancel Sugar reminder ${notificationId}:`, e);
    }
  }

  // ----------------------------------------------------
  // IMMEDIATE REMINDER & TEST UTILITIES
  // ----------------------------------------------------

  /**
   * Immediately displays a normal reminder notification with action buttons.
   * Completely bypasses background scheduler so Mom/User can verify
   * standard chime, gentle banner, and action buttons instantly.
   */
  async displayReminderNow(medicineName: string = 'Metformin', dosage: string = '500 mg'): Promise<string> {
    await this.ensureChannels();
    const permitted = await this.requestPermissions();
    if (!permitted) {
      throw new Error('NOTIFICATIONS_DISABLED');
    }

    const testId = `reminder_now_${Date.now()}`;

    await notifee.displayNotification({
      id: testId,
      title: `Medicine Reminder: ${medicineName}`,
      body: `${dosage} • Take with water\nTap Mark as Taken below or open Inai.`,
      data: {
        isTest: 'true',
        medicineName,
        dosage,
      },
      android: {
        channelId: MEDICINE_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.REMINDER,
        loopSound: false,
        ongoing: false,
        autoCancel: true,
        pressAction: {
          id: 'default',
        },
        actions: [
          {
            title: 'Mark as Taken',
            pressAction: {
              id: 'mark_taken',
            },
          },
          {
            title: 'Remind in 10m',
            pressAction: {
              id: 'snooze_10',
            },
          },
        ],
      },
      ios: {
        sound: 'default',
      },
    });

    return testId;
  }

  async displayAlarmNow(medicineName?: string, dosage?: string): Promise<string> {
    return this.displayReminderNow(medicineName, dosage);
  }

  /**
   * Tests reminder notification firing after a short delay (e.g. 5 seconds)
   * so user can lock their phone to test lock screen notification.
   */
  async triggerTestReminder(medicineName: string = 'Metformin', delaySeconds: number = 5): Promise<string> {
    await this.ensureChannels();
    const permitted = await this.requestPermissions();
    if (!permitted) {
      throw new Error('NOTIFICATIONS_DISABLED');
    }

    const testId = `test_reminder_${Date.now()}`;
    const triggerDate = new Date(Date.now() + delaySeconds * 1000);

    const notificationPayload = {
      id: testId,
      title: `Medicine Reminder Test: ${medicineName}`,
      body: `500 mg • Take with water\nTap Mark as Taken to test the action button.`,
      data: {
        isTest: 'true',
        medicineName,
      },
      android: {
        channelId: MEDICINE_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.REMINDER,
        loopSound: false,
        ongoing: false,
        autoCancel: true,
        pressAction: {
          id: 'default',
        },
        actions: [
          {
            title: 'Mark as Taken',
            pressAction: {
              id: 'mark_taken',
            },
          },
          {
            title: 'Remind in 10m',
            pressAction: {
              id: 'snooze_10',
            },
          },
        ],
      },
      ios: {
        sound: 'default',
      },
    };

    try {
      await notifee.createTriggerNotification(notificationPayload, {
        type: TriggerType.TIMESTAMP,
        timestamp: triggerDate.getTime(),
        alarmManager: {
          type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
        },
      });
    } catch (err) {
      console.warn('Reminder trigger fallback to setTimeout display:', err);
    }

    // Safety fallback: if AlarmManager is throttled by OS for short 5s windows,
    // ensure displayNotification fires so user is never left without feedback
    setTimeout(async () => {
      try {
        const displayed = await notifee.getDisplayedNotifications();
        const alreadyFired = displayed.some((d) => d.id === testId);
        if (!alreadyFired) {
          await notifee.displayNotification(notificationPayload);
        }
      } catch (e) {
        console.warn('Fallback test notification error:', e);
      }
    }, delaySeconds * 1000);

    return testId;
  }

  async triggerTestAlarm(medicineName?: string, delaySeconds?: number): Promise<string> {
    return this.triggerTestReminder(medicineName, delaySeconds);
  }

  async checkAlarmPermissions(): Promise<{ exactAlarmPermitted: boolean; notificationsPermitted: boolean }> {
    try {
      const settings = await notifee.getNotificationSettings();
      const notificationsPermitted = settings.authorizationStatus >= 1;
      const exactAlarmPermitted =
        settings.android?.alarm !== undefined
          ? settings.android.alarm !== 0
          : true;
      return { exactAlarmPermitted, notificationsPermitted };
    } catch {
      return { exactAlarmPermitted: true, notificationsPermitted: true };
    }
  }

  async openNotificationSettings(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        await notifee.openNotificationSettings();
      } catch (e) {
        console.warn('Failed to open notification settings:', e);
      }
    }
  }

  async openAlarmSettings(): Promise<void> {
    if (Platform.OS === 'android') {
      try {
        await notifee.openAlarmPermissionSettings();
      } catch {
        await notifee.openNotificationSettings();
      }
    }
  }
}

// Default singleton notification provider instance
export const notificationProvider: INotificationProvider = new NotifeeNotificationProvider();
