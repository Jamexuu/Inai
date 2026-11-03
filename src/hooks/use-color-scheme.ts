import { useEffect } from 'react';
import { useColorScheme as useRNColorScheme, Appearance } from 'react-native';
import { colorScheme as nativewindColorScheme } from 'nativewind';
import { useAppStore } from '@/store/app.store';

/**
 * Synchronizes the app-level theme preference ('light' | 'dark' | 'system')
 * with NativeWind v4's CSS engine and React Native's Appearance API.
 */
export function syncAppTheme(mode: 'light' | 'dark' | 'system') {
  try {
    nativewindColorScheme.set(mode);
  } catch {
    // Ignore in unsupported environments
  }

  try {
    if (mode === 'system') {
      (Appearance as { setColorScheme?: (scheme: string | null) => void }).setColorScheme?.('unspecified');
    } else {
      Appearance.setColorScheme(mode);
    }
  } catch {
    // Ignore in unsupported environments
  }
}

export function useColorScheme(): 'light' | 'dark' {
  const systemScheme = useRNColorScheme();
  const themeMode = useAppStore((state) => state.themeMode);

  useEffect(() => {
    syncAppTheme(themeMode);
  }, [themeMode]);

  if (themeMode === 'light') return 'light';
  if (themeMode === 'dark') return 'dark';
  return systemScheme === 'dark' ? 'dark' : 'light';
}

