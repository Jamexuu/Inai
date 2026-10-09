import '../global.css';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { DefaultTheme, ThemeProvider } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import AppTabs from '@/components/app-tabs';
import { initializeDatabase } from '@/database/database';
import { seedInitialDataIfEmpty } from '@/database/seed';
import { useAppStore } from '@/store/app.store';
import { setupNotificationEventHandlers } from '@/notifications';
import { PermissionPromptModal } from '@/components/permission-prompt-modal';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const setDatabaseReady = useAppStore((state) => state.setDatabaseReady);
  const [ready, setReady] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    const unsubscribeNotifications = setupNotificationEventHandlers();

    async function prepare() {
      try {
        await initializeDatabase();
        await seedInitialDataIfEmpty();
        const { medicineService } = await import('@/services/medicine.service');
        const { mealService } = await import('@/services/meal.service');
        const { bloodPressureService } = await import('@/services/blood-pressure.service');
        await Promise.allSettled([
          medicineService.syncAllMedicineReminders(),
          mealService.syncAllMealReminders(),
          bloodPressureService.syncAllBPReminders(),
        ]);
        setDatabaseReady(true);

        // Check if permission prompt has been shown to new user
        const { settingsService } = await import('@/services/settings.service');
        const hasDecided = await settingsService.hasPromptedPermissions();
        if (!hasDecided) {
          const { notificationProvider } = await import('@/notifications');
          const perms = await notificationProvider.checkAlarmPermissions();
          if (!perms.notificationsPermitted) {
            setShowPermissionModal(true);
          } else {
            await settingsService.markPermissionsPromptDecided();
          }
        }
      } catch (e) {
        console.warn('Error during app startup preparation:', e);
      } finally {
        setReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }

    prepare();

    return () => {
      unsubscribeNotifications();
    };
  }, [setDatabaseReady]);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={DefaultTheme}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF7F2" translucent={false} />
        {ready ? (
          <>
            <AppTabs />
            <PermissionPromptModal
              visible={showPermissionModal}
              onAllow={() => setShowPermissionModal(false)}
              onDeny={() => setShowPermissionModal(false)}
            />
          </>
        ) : null}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

