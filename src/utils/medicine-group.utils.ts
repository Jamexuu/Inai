import { TimeSlot, TodayMedicineDose } from '@/types';
import { formatTo12Hour } from './date.utils';

export interface MedicineRoutineSlotGroup {
  id: string;
  timeSlot: TimeSlot;
  slotTitle: string;
  slotSubtitle: string;
  iconName: 'sunny-outline' | 'restaurant-outline' | 'moon-outline' | 'bed-outline';
  iconColor: string;
  iconBg: string;
  reminderTime: string;
  formattedTime: string;
  doses: TodayMedicineDose[];
  allTaken: boolean;
  allSkipped: boolean;
  someTaken: boolean;
  pendingCount: number;
  takenCount: number;
  totalCount: number;
}

const SLOT_CONFIG: Record<
  TimeSlot,
  {
    title: string;
    subtitle: string;
    icon: 'sunny-outline' | 'restaurant-outline' | 'moon-outline' | 'bed-outline';
    color: string;
    bg: string;
    order: number;
  }
> = {
  morning: {
    title: 'Morning Routine',
    subtitle: 'After Breakfast',
    icon: 'sunny-outline',
    color: '#B8860B',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    order: 1,
  },
  afternoon: {
    title: 'After Lunch Routine',
    subtitle: 'After Lunch',
    icon: 'restaurant-outline',
    color: '#C06C4E',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    order: 2,
  },
  evening: {
    title: 'Evening Routine',
    subtitle: 'After Dinner',
    icon: 'moon-outline',
    color: '#3D5A50',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    order: 3,
  },
  bedtime: {
    title: 'Bedtime Routine',
    subtitle: 'Before Sleep',
    icon: 'bed-outline',
    color: '#4A6572',
    bg: 'bg-slate-100 dark:bg-slate-900/40',
    order: 4,
  },
};

/**
 * Groups a day's medicine doses by time slot (Morning, After Lunch, Evening, Bedtime)
 * so Mom can take all medicines scheduled for that routine in a single combined card.
 */
export function groupDosesBySlot(doses: TodayMedicineDose[]): MedicineRoutineSlotGroup[] {
  if (!doses || doses.length === 0) return [];

  const slotsOrder: TimeSlot[] = ['morning', 'afternoon', 'evening', 'bedtime'];
  const groups: MedicineRoutineSlotGroup[] = [];

  for (const slot of slotsOrder) {
    const slotDoses = doses.filter((d) => d.timeSlot === slot);
    if (slotDoses.length === 0) continue;

    // Sort doses in this slot chronologically
    slotDoses.sort((a, b) => a.reminderTime.localeCompare(b.reminderTime));

    const config = SLOT_CONFIG[slot];
    const earliestTime = slotDoses[0].reminderTime;
    const formattedTime = formatTo12Hour(earliestTime);

    const takenCount = slotDoses.filter((d) => d.status === 'taken').length;
    const skippedCount = slotDoses.filter((d) => d.status === 'skipped').length;
    const totalCount = slotDoses.length;
    const pendingCount = totalCount - takenCount - skippedCount;

    const allTaken = totalCount > 0 && takenCount === totalCount;
    const allSkipped = totalCount > 0 && skippedCount === totalCount;
    const someTaken = takenCount > 0 && !allTaken;

    groups.push({
      id: `slot_${slot}`,
      timeSlot: slot,
      slotTitle: config.title,
      slotSubtitle: config.subtitle,
      iconName: config.icon,
      iconColor: config.color,
      iconBg: config.bg,
      reminderTime: earliestTime,
      formattedTime,
      doses: slotDoses,
      allTaken,
      allSkipped,
      someTaken,
      pendingCount,
      takenCount,
      totalCount,
    });
  }

  // Fallback for any doses with non-standard slot
  const recognizedSlots = new Set(slotsOrder);
  const otherDoses = doses.filter((d) => !recognizedSlots.has(d.timeSlot));
  if (otherDoses.length > 0) {
    const earliestTime = otherDoses[0].reminderTime;
    const takenCount = otherDoses.filter((d) => d.status === 'taken').length;
    const totalCount = otherDoses.length;
    const pendingCount = otherDoses.filter((d) => d.status === 'pending').length;

    groups.push({
      id: 'slot_other',
      timeSlot: 'morning',
      slotTitle: 'Other Scheduled Meds',
      slotSubtitle: 'Daily Prescription',
      iconName: 'sunny-outline',
      iconColor: '#3D5A50',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
      reminderTime: earliestTime,
      formattedTime: formatTo12Hour(earliestTime),
      doses: otherDoses,
      allTaken: takenCount === totalCount,
      allSkipped: otherDoses.every((d) => d.status === 'skipped'),
      someTaken: takenCount > 0 && takenCount < totalCount,
      pendingCount,
      takenCount,
      totalCount,
    });
  }

  return groups;
}
