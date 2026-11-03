import '../global.css';
import React, { useEffect, useState } from 'react';
import { StatusBar as RNStatusBar, View } from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';

import AppTabs from '@/components/app-tabs';
import { initializeDatabase } from '@/database/database';
import { seedInitialDataIfEmpty } from '@/database/seed';
import { useAppStore } from '@/store/app.store';
import { setupNotificationEventHandlers } from '@/notifications';
import { PermissionPromptModal } from '@/components/permission-prompt-modal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const setDatabaseReady = useAppStore((state) => state.setDatabaseReady);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const [ready, setReady] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = Colors[isDark ? 'dark' : 'light'];

  useEffect(() => {
    const unsubscribeNotifications = setupNotificationEventHandlers();

    async function prepare() {
      try {
        await initializeDatabase();
        await seedInitialDataIfEmpty();

        const { settingsService } = await import('@/services/settings.service');
        const savedTheme = await settingsService.getThemeMode();
        setThemeMode(savedTheme);

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
  }, [setDatabaseReady, setThemeMode]);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
        {/* Phone notification bar (status bar) is guaranteed visible with high contrast across all tabs */}
        <RNStatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={isDark ? '#181715' : '#FAF7F2'}
          translucent={false}
          hidden={false}
        />
        <ExpoStatusBar
          style={isDark ? 'light' : 'dark'}
          hidden={false}
        />
        <View
          style={{ backgroundColor: colors.background }}
          className={`flex-1 ${isDark ? 'dark bg-canvas-dark' : 'bg-canvas'}`}>
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
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
