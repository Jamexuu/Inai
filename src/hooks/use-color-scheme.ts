import { useEffect } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';
import { useAppStore } from '@/store/app.store';
import { syncAppTheme } from '@/utils/theme.utils';

export { syncAppTheme };

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
