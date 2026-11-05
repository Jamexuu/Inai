import { Appearance } from 'react-native';
import { colorScheme as nativewindColorScheme } from 'nativewind';

/**
 * Synchronizes the app-level theme preference ('light' | 'dark' | 'system')
 * with NativeWind v4's CSS engine and React Native's Appearance API.
 */
export function syncAppTheme(mode: 'light' | 'dark' | string) {
  const resolved = mode === 'dark' ? 'dark' : 'light';
  try {
    nativewindColorScheme.set(resolved);
  } catch {
    // Ignore in unsupported environments
  }

  try {
    Appearance.setColorScheme(resolved);
  } catch {
    // Ignore in unsupported environments
  }
}
