import { create } from 'zustand';
import { AppThemeMode, settingsService } from '@/services/settings.service';

interface AppState {
  selectedDate: string; // YYYY-MM-DD
  isDatabaseReady: boolean;
  refreshTrigger: number;
  isAddModalVisible: boolean;
  selectedMedicineId: string | null;
  themeMode: AppThemeMode;

  // Actions
  setSelectedDate: (date: string) => void;
  setDatabaseReady: (ready: boolean) => void;
  triggerRefresh: () => void;
  setAddModalVisible: (visible: boolean) => void;
  setSelectedMedicineId: (id: string | null) => void;
  setThemeMode: (mode: AppThemeMode) => void;
}

const getTodayDateStr = () => new Date().toISOString().substring(0, 10);

export const useAppStore = create<AppState>((set) => ({
  selectedDate: getTodayDateStr(),
  isDatabaseReady: false,
  refreshTrigger: 0,
  isAddModalVisible: false,
  selectedMedicineId: null,
  themeMode: 'light', // Default to warm light mode for Mom

  setSelectedDate: (date: string) => set({ selectedDate: date }),
  setDatabaseReady: (ready: boolean) => set({ isDatabaseReady: ready }),
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
  setAddModalVisible: (visible: boolean) => set({ isAddModalVisible: visible }),
  setSelectedMedicineId: (id: string | null) => set({ selectedMedicineId: id }),
  setThemeMode: (mode: AppThemeMode) => {
    set({ themeMode: mode });
    settingsService.setThemeMode(mode).catch((e) => {
      console.warn('Failed to persist theme mode:', e);
    });
  },
}));
