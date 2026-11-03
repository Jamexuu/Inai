import { useColorScheme as useRNColorScheme } from 'react-native';
import { useAppStore } from '@/store/app.store';

export function useColorScheme(): 'light' | 'dark' {
  const systemScheme = useRNColorScheme();
  const themeMode = useAppStore((state) => state.themeMode);

  if (themeMode === 'light') return 'light';
  if (themeMode === 'dark') return 'dark';
  return systemScheme === 'dark' ? 'dark' : 'light';
}
