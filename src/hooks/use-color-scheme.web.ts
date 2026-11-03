import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useAppStore } from '@/store/app.store';

/**
 * Client-side color scheme resolution for web with custom settings support
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);
  const systemScheme = useRNColorScheme();
  const themeMode = useAppStore((state) => state.themeMode);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  if (themeMode === 'light') return 'light';
  if (themeMode === 'dark') return 'dark';
  if (hasHydrated && systemScheme === 'dark') {
    return 'dark';
  }

  return 'light';
}
