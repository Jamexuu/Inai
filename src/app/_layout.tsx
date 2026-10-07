import '../global.css';
import React, { useEffect, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { initializeDatabase } from '@/database/database';
import { seedInitialDataIfEmpty } from '@/database/seed';
import { useAppStore } from '@/store/app.store';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const setDatabaseReady = useAppStore((state) => state.setDatabaseReady);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initializeDatabase();
        await seedInitialDataIfEmpty();
        setDatabaseReady(true);
      } catch (e) {
        console.warn('Error during app startup preparation:', e);
      } finally {
        setReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    }

    prepare();
  }, [setDatabaseReady]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {ready ? <AppTabs /> : null}
    </ThemeProvider>
  );
}
