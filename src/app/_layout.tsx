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

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
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
    <SafeAreaProvider>
      <ThemeProvider value={DefaultTheme}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAF7F2" translucent={false} />
        {ready ? <AppTabs /> : null}
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
