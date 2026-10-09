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

const ALARM_CHANNEL_ID = 'inai_medicine_alarms';
const ALARM_CHANNEL_NAME = 'Medicine Alarms (Loud)';

const MEAL_CHANNEL_ID = 'inai_meal_alarms';
const MEAL_CHANNEL_NAME = 'Meal Alarms';

const BP_CHANNEL_ID = 'inai_bp_alarms';
const BP_CHANNEL_NAME = 'Blood Pressure Alarms';

export class NotifeeNotificationProvider implements INotificationProvider {
  private channelsCreated = false;

  private async ensureChannels(): Promise<void> {
    if (this.channelsCreated || Platform.OS !== 'android') return;

    try {
      // 1. Medicine Alarm Channel (High priority, looping sound, vibration)
      await notifee.createChannel({
        id: ALARM_CHANNEL_ID,
        name: ALARM_CHANNEL_NAME,
        description: 'Loud insistent alarm reminders for daily medicine intake',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [300, 500, 300, 500, 300, 500],
        bypassDnd: true,
      });

      // 2. Meal Alarm Channel
      await notifee.createChannel({
        id: MEAL_CHANNEL_ID,
        name: MEAL_CHANNEL_NAME,
        description: 'Reminders for daily meals (Breakfast, Lunch, Dinner, Snack)',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [300, 400, 300, 400],
        bypassDnd: true,
      });

      // 3. Blood Pressure Alarm Channel
      await notifee.createChannel({
        id: BP_CHANNEL_ID,
        name: BP_CHANNEL_NAME,
        description: 'Reminders to check and monitor daily blood pressure',
        importance: AndroidImportance.HIGH,
        sound: 'default',
        vibration: true,
        vibrationPattern: [300, 400, 300, 400],
        bypassDnd: true,
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

    // Schedule using Android's AlarmManager for exact wake-up in idle mode
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
      title: `Medicine Alarm: ${reminder.medicineName}`,
      body: `${subtitleText}\nTime to take your scheduled dose.`,
      data: {
        medicineId: reminder.medicineId,
        scheduleId: reminder.scheduleId,
        medicineName: reminder.medicineName,
        dosage: reminder.dosage,
      },
      android: {
        channelId: ALARM_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.ALARM,
        loopSound: true,
        ongoing: true,
        autoCancel: false,
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
        critical: true,
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
      title: `Meal Alarm: ${meal.label}`,
      body: `Time for a calm, healthy meal. Maintain your daily eating routine.`,
      data: {
        type: 'meal',
        mealId: meal.id,
        mealType: meal.mealType,
      },
      android: {
        channelId: MEAL_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.ALARM,
        loopSound: true,
        ongoing: true,
        autoCancel: false,
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
        critical: true,
      },
    };

    try {
      await notifee.createTriggerNotification(notificationPayload, trigger);
    } catch (err) {
      console.warn('Meal alarm trigger failed, using standard trigger:', err);
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
      title: params.label,
      body: `Rest quietly for 5 minutes, then take and log your reading.`,
      data: {
        type: 'bp',
        slot: params.id,
      },
      android: {
        channelId: BP_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.ALARM,
        loopSound: true,
        ongoing: true,
        autoCancel: false,
        pressAction: {
          id: 'default',
        },
        actions: [
          {
            title: 'Log Blood Pressure',
            pressAction: {
              id: 'open_bp_log',
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
        critical: true,
      },
    };

    try {
      await notifee.createTriggerNotification(notificationPayload, trigger);
    } catch (err) {
      console.warn('BP alarm trigger failed, using standard trigger:', err);
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

  // ----------------------------------------------------
  // IMMEDIATE ALARM & TEST UTILITIES
  // ----------------------------------------------------

  /**
   * Immediately rings the alarm on device.
   * Completely bypasses background scheduler so Mom/User can verify
   * loud looping sound, vibration, and lock screen actions instantly.
   */
  async displayAlarmNow(medicineName: string = 'Paracetamol', dosage: string = '500 mg'): Promise<string> {
    await this.ensureChannels();
    const permitted = await this.requestPermissions();
    if (!permitted) {
      throw new Error('NOTIFICATIONS_DISABLED');
    }

    const testId = `alarm_now_${Date.now()}`;

    await notifee.displayNotification({
      id: testId,
      title: `Medicine Alarm: ${medicineName}`,
      body: `${dosage} • Take with water\nTap Stop Alarm below or mark as taken.`,
      data: {
        isTest: 'true',
        medicineName,
        dosage,
      },
      android: {
        channelId: ALARM_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.ALARM,
        loopSound: true,
        ongoing: true,
        autoCancel: false,
        pressAction: {
          id: 'default',
        },
        actions: [
          {
            title: 'Stop Alarm',
            pressAction: {
              id: 'dismiss_test',
            },
          },
          {
            title: 'Mark as Taken',
            pressAction: {
              id: 'mark_taken',
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

  /**
   * Tests alarm firing after a short delay (e.g. 5 seconds)
   * so user can lock their phone to test lock screen alert.
   */
  async triggerTestAlarm(medicineName: string = 'Paracetamol', delaySeconds: number = 5): Promise<string> {
    await this.ensureChannels();
    const permitted = await this.requestPermissions();
    if (!permitted) {
      throw new Error('NOTIFICATIONS_DISABLED');
    }

    const testId = `test_alarm_${Date.now()}`;
    const triggerDate = new Date(Date.now() + delaySeconds * 1000);

    const notificationPayload = {
      id: testId,
      title: `Medicine Alarm Test: ${medicineName}`,
      body: `500 mg • Take with water\nThis is a test alarm. Tap below to stop.`,
      data: {
        isTest: 'true',
        medicineName,
      },
      android: {
        channelId: ALARM_CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        category: AndroidCategory.ALARM,
        loopSound: true,
        ongoing: true,
        autoCancel: false,
        pressAction: {
          id: 'default',
        },
        actions: [
          {
            title: 'Stop Alarm',
            pressAction: {
              id: 'dismiss_test',
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
      console.warn('Alarm trigger failed, falling back to setTimeout display:', err);
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
