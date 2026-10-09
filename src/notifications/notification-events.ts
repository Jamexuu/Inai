import notifee, {
  EventType,
  TimestampTrigger,
  TriggerType,
  AlarmType,
} from '@notifee/react-native';
import { medicineService } from '@/services/medicine.service';
import { mealService } from '@/services/meal.service';
import { useAppStore } from '@/store/app.store';

/**
 * Handle notification background and foreground actions
 * like 'Mark as Taken', 'Mark as Done', and 'Remind in 10m'.
 */
export function setupNotificationEventHandlers(): () => void {
  // Background events
  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.ACTION_PRESS) {
      const actionId = detail.pressAction?.id;
      const notificationId = detail.notification?.id;

      if (actionId === 'mark_taken') {
        const medicineId = detail.notification?.data?.medicineId as string;
        const scheduleId = detail.notification?.data?.scheduleId as string;
        if (medicineId) {
          try {
            await medicineService.markDose({
              medicineId,
              scheduleId,
              scheduledTime: new Date().toISOString().substring(11, 16),
              status: 'taken',
            });
          } catch (e) {
            console.warn('Error recording dose from background action:', e);
          }
        }
        if (notificationId) {
          await notifee.cancelNotification(notificationId);
        }
      } else if (actionId === 'mark_meal_done') {
        const mealId = detail.notification?.data?.mealId as string;
        const mealType = detail.notification?.data?.mealType as any;
        if (mealType) {
          try {
            await mealService.markMeal({
              mealType,
              status: 'completed',
              mealId,
            });
          } catch (e) {
            console.warn('Error recording meal done from background action:', e);
          }
        }
        if (notificationId) {
          await notifee.cancelNotification(notificationId);
        }
      } else if (actionId === 'snooze_10') {
        if (notificationId) {
          await notifee.cancelNotification(notificationId);
        }
        const snoozeDate = new Date(Date.now() + 10 * 60 * 1000);
        const snoozeTrigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: snoozeDate.getTime(),
          alarmManager: {
            type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
          },
        };
        if (detail.notification) {
          await notifee.createTriggerNotification(
            {
              ...detail.notification,
              id: `snooze_${Date.now()}`,
              title: `(Snoozed) ${detail.notification.title || 'Reminder'}`,
            },
            snoozeTrigger
          );
        }
      } else if (actionId === 'dismiss_test' || actionId === 'open_bp_log') {
        if (notificationId) {
          await notifee.cancelNotification(notificationId);
        }
      }
    }
  });

  // Foreground events
  const unsubscribeForeground = notifee.onForegroundEvent(async ({ type, detail }) => {
    if (type === EventType.ACTION_PRESS) {
      const actionId = detail.pressAction?.id;
      const notificationId = detail.notification?.id;

      if (actionId === 'mark_taken') {
        const medicineId = detail.notification?.data?.medicineId as string;
        const scheduleId = detail.notification?.data?.scheduleId as string;
        if (medicineId) {
          try {
            await medicineService.markDose({
              medicineId,
              scheduleId,
              scheduledTime: new Date().toISOString().substring(11, 16),
              status: 'taken',
            });
            useAppStore.getState().triggerRefresh();
          } catch (e) {
            console.warn('Error recording dose from foreground action:', e);
          }
        }
        if (notificationId) {
          await notifee.cancelNotification(notificationId);
        }
      } else if (actionId === 'mark_meal_done') {
        const mealId = detail.notification?.data?.mealId as string;
        const mealType = detail.notification?.data?.mealType as any;
        if (mealType) {
          try {
            await mealService.markMeal({
              mealType,
              status: 'completed',
              mealId,
            });
            useAppStore.getState().triggerRefresh();
          } catch (e) {
            console.warn('Error recording meal done from foreground action:', e);
          }
        }
        if (notificationId) {
          await notifee.cancelNotification(notificationId);
        }
      } else if (actionId === 'snooze_10') {
        if (notificationId) {
          await notifee.cancelNotification(notificationId);
        }
        const snoozeDate = new Date(Date.now() + 10 * 60 * 1000);
        const snoozeTrigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: snoozeDate.getTime(),
          alarmManager: {
            type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
          },
        };
        if (detail.notification) {
          await notifee.createTriggerNotification(
            {
              ...detail.notification,
              id: `snooze_${Date.now()}`,
              title: `(Snoozed) ${detail.notification.title || 'Reminder'}`,
            },
            snoozeTrigger
          );
        }
      } else if (actionId === 'dismiss_test' || actionId === 'open_bp_log') {
        if (notificationId) {
          await notifee.cancelNotification(notificationId);
        }
      }
    }
  });

  return unsubscribeForeground;
}
