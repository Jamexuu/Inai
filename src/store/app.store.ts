import { create } from 'zustand';

interface AppState {
  selectedDate: string; // YYYY-MM-DD
  isDatabaseReady: boolean;
  refreshTrigger: number;
  isAddModalVisible: boolean;
  selectedMedicineId: string | null;

  // Actions
  setSelectedDate: (date: string) => void;
  setDatabaseReady: (ready: boolean) => void;
  triggerRefresh: () => void;
  setAddModalVisible: (visible: boolean) => void;
  setSelectedMedicineId: (id: string | null) => void;
}

const getTodayDateStr = () => new Date().toISOString().substring(0, 10);

export const useAppStore = create<AppState>((set) => ({
  selectedDate: getTodayDateStr(),
  isDatabaseReady: false,
  refreshTrigger: 0,
  isAddModalVisible: false,
  selectedMedicineId: null,

  setSelectedDate: (date: string) => set({ selectedDate: date }),
  setDatabaseReady: (ready: boolean) => set({ isDatabaseReady: ready }),
  triggerRefresh: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
  setAddModalVisible: (visible: boolean) => set({ isAddModalVisible: visible }),
  setSelectedMedicineId: (id: string | null) => set({ selectedMedicineId: id }),
}));

