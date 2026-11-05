import { useEffect } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useAppStore } from '@/store/app.store';
import { syncAppTheme } from '@/utils/theme.utils';

export { syncAppTheme };

export function useColorScheme(): 'light' | 'dark' {
  const themeMode = useAppStore((state) => state.themeMode);

  useEffect(() => {
    syncAppTheme(themeMode);
  }, [themeMode]);

  if (themeMode === 'dark') return 'dark';
  return 'light';
}
