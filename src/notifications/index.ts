export * from './notification-provider.interface';
export * from './notifee-notification.provider';

import { INotificationProvider } from './notification-provider.interface';
import { NotifeeNotificationProvider } from './notifee-notification.provider';

// Default singleton notification provider instance
export const notificationProvider: INotificationProvider = new NotifeeNotificationProvider();

