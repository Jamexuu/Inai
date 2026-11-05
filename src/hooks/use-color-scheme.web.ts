import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useAppStore } from '@/store/app.store';

/**
 * Client-side color scheme resolution for web with custom settings support
 */
export function useColorScheme(): 'light' | 'dark' {
  const themeMode = useAppStore((state) => state.themeMode);

  if (themeMode === 'dark') return 'dark';
  return 'light';
}
