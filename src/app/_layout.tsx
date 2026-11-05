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
import { UserNameModal } from '@/components/user-name-modal';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const setDatabaseReady = useAppStore((state) => state.setDatabaseReady);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const setUserName = useAppStore((state) => state.setUserName);
  const [ready, setReady] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
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
        const { bloodSugarService } = await import('@/services/blood-sugar.service');
        // Sequentially sync reminders to eliminate startup SQLite lock contention
        await medicineService.syncAllMedicineReminders();
        await mealService.syncAllMealReminders();
        await bloodPressureService.syncAllBPReminders();
        await bloodSugarService.syncAllSugarReminders();
        setDatabaseReady(true);

        const { userProfileService } = await import('@/services/user-profile.service');
        const profile = await userProfileService.getUserProfile();
        if (profile && profile.name.trim()) {
          setUserName(profile.nickname || profile.name);

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
        } else {
          // Allow the user to enter their name first before using the application
          setShowNameModal(true);
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
  }, [setDatabaseReady, setThemeMode, setUserName]);

  const handleSaveName = async (name: string) => {
    try {
      const { userProfileService } = await import('@/services/user-profile.service');
      await userProfileService.saveUserName(name);
      setUserName(name);
    } catch (e) {
      console.warn('Failed to save user name on onboarding:', e);
    } finally {
      setShowNameModal(false);

      // Check if permission prompt should be presented next
      try {
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
        console.warn('Failed to check permissions after name onboarding:', e);
      }
    }
  };

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
              <UserNameModal
                visible={showNameModal}
                canDismiss={false}
                onSave={handleSaveName}
              />
              <PermissionPromptModal
                visible={showPermissionModal && !showNameModal}
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
