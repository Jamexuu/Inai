/**
 * Date and Time Utilities for Inai
 *
 * Enforces strictly 12-hour time format (e.g. 8:00 AM, 1:30 PM) across all user-facing screens,
 * while safely handling conversions to/from 24-hour canonical time ("HH:mm") for SQLite & Notifee.
 */

/**
 * Converts a 24-hour time string ("HH:mm" or "H:mm") or Date into user-facing 12-hour format ("h:mm A").
 *
 * Examples:
 * - "08:00" -> "8:00 AM"
 * - "12:30" -> "12:30 PM"
 * - "18:30" -> "6:30 PM"
 * - "21:00" -> "9:00 PM"
 * - "00:15" -> "12:15 AM"
 */
export function formatTo12Hour(time: string | Date | null | undefined): string {
  if (!time) return '';

  if (time instanceof Date) {
    const hours = time.getHours();
    const minutes = time.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${period}`;
  }

  const str = String(time).trim();

  // If already contains AM or PM
  if (/am|pm/i.test(str)) {
    return str.toUpperCase();
  }

  // Handle ISO datetime string like "2026-10-10 08:00" or "2026-10-10T08:00:00"
  if (str.includes('T') || str.includes('-')) {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return formatTo12Hour(parsed);
    }
  }

  // Standard "HH:mm" or "H:mm"
  const parts = str.split(':');
  if (parts.length >= 2) {
    const rawHours = parseInt(parts[0], 10);
    const rawMinutes = parseInt(parts[1], 10);

    if (!isNaN(rawHours) && !isNaN(rawMinutes)) {
      const period = rawHours >= 12 ? 'PM' : 'AM';
      const displayHours = rawHours % 12 === 0 ? 12 : rawHours % 12;
      const displayMinutes = rawMinutes.toString().padStart(2, '0');
      return `${displayHours}:${displayMinutes} ${period}`;
    }
  }

  return str;
}

/**
 * Converts any user input or 12-hour string back to canonical 24-hour format ("HH:mm")
 * for reliable SQLite queries and Notifee trigger scheduling.
 *
 * Examples:
 * - "8:00 AM" -> "08:00"
 * - "1:30 PM" -> "13:30"
 * - "9:00 PM" -> "21:00"
 * - "12:00 AM" -> "00:00"
 * - "12:00 PM" -> "12:00"
 * - "08:00" -> "08:00"
 */
export function parseTo24Hour(timeStr: string): string {
  if (!timeStr) return '08:00';

  const cleaned = timeStr.trim();

  // Match 12-hour format like "8:00 AM", "08:00am", "8 AM", "8:30pm"
  const match12 = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = match12[2] ? parseInt(match12[2], 10) : 0;
    const period = match12[3].toUpperCase();

    if (period === 'PM' && hours < 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  // Match standard 24-hour format "HH:mm" or "H:mm"
  const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
  }

  return cleaned;
}

/**
 * Formats a Date object to "Mon, Oct 10" or "Saturday, October 10"
 */
export function formatFriendlyDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Parses any 12-hour or 24-hour time string into decomposed components:
 * hour (1-12), minute (0-59), and period ("AM" | "PM").
 */
export function parse12HourParts(timeStr?: string | null): {
  hour: number;
  minute: number;
  period: 'AM' | 'PM';
} {
  const formatted = formatTo12Hour(timeStr) || '8:00 AM';
  const match = formatted.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) {
    return {
      hour: parseInt(match[1], 10),
      minute: parseInt(match[2], 10),
      period: match[3].toUpperCase() === 'PM' ? 'PM' : 'AM',
    };
  }
  return { hour: 8, minute: 0, period: 'AM' };
}



/**
 * Formats a Date object to local "YYYY-MM-DD"
 */
export function formatDateToYMD(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getYesterdayYMD(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateToYMD(d);
}

export function getTwoDaysAgoYMD(): string {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return formatDateToYMD(d);
}

export function formatYMDToDisplay(ymd: string): string {
  if (!ymd) return '';
  const today = formatDateToYMD();
  const yesterday = getYesterdayYMD();
  if (ymd === today) return 'Today';
  if (ymd === yesterday) return 'Yesterday';

  const parts = ymd.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: year !== new Date().getFullYear() ? 'numeric' : undefined,
      });
    }
  }
  return ymd;
}

export function formatYMDToFullFriendly(ymd: string): string {
  if (!ymd) return '';
  const parts = ymd.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }
  return ymd;
}

export interface WeekDayItem {
  date: Date;
  ymd: string;
  dayName: string; // 'Mon', 'Tue', ...
  dayNumber: number; // 1, 2, ...
  isToday: boolean;
  isFuture: boolean;
}

/**
 * Returns the 7 days of the week (Monday through Sunday) containing the referenceDate.
 */
export function getWeekDates(referenceDate: Date = new Date()): WeekDayItem[] {
  const ref = new Date(referenceDate);
  const dayOfWeek = ref.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const monday = new Date(ref);
  monday.setDate(ref.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const todayYMD = formatDateToYMD(new Date());

  const days: WeekDayItem[] = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const ymd = formatDateToYMD(d);
    days.push({
      date: d,
      ymd,
      dayName: dayNames[i],
      dayNumber: d.getDate(),
      isToday: ymd === todayYMD,
      isFuture: ymd > todayYMD,
    });
  }

  return days;
}

export function getPreviousWeekDate(referenceDate: Date): Date {
  const d = new Date(referenceDate);
  d.setDate(d.getDate() - 7);
  return d;
}

export function getNextWeekDate(referenceDate: Date): Date {
  const d = new Date(referenceDate);
  d.setDate(d.getDate() + 7);
  return d;
}

export function formatWeekRangeDisplay(referenceDate: Date): string {
  const weekDays = getWeekDates(referenceDate);
  const first = weekDays[0].date;
  const last = weekDays[6].date;

  const firstMonth = first.toLocaleDateString('en-US', { month: 'short' });
  const lastMonth = last.toLocaleDateString('en-US', { month: 'short' });
  const year = last.getFullYear();

  if (firstMonth === lastMonth) {
    return `${firstMonth} ${first.getDate()} – ${last.getDate()}, ${year}`;
  }
  return `${firstMonth} ${first.getDate()} – ${lastMonth} ${last.getDate()}, ${year}`;
}

export type DayCode = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export const ALL_DAYS: DayCode[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
export const WEEKDAYS: DayCode[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
export const WEEKENDS: DayCode[] = ['SAT', 'SUN'];

export const DAY_LABELS: Record<DayCode, { short: string; full: string; letter: string }> = {
  MON: { short: 'Mon', full: 'Monday', letter: 'M' },
  TUE: { short: 'Tue', full: 'Tuesday', letter: 'T' },
  WED: { short: 'Wed', full: 'Wednesday', letter: 'W' },
  THU: { short: 'Thu', full: 'Thursday', letter: 'T' },
  FRI: { short: 'Fri', full: 'Friday', letter: 'F' },
  SAT: { short: 'Sat', full: 'Saturday', letter: 'S' },
  SUN: { short: 'Sun', full: 'Sunday', letter: 'S' },
};

const DAY_INDEX_MAP: DayCode[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const LEGACY_NUM_TO_DAY: Record<string, DayCode> = {
  '1': 'MON',
  '2': 'TUE',
  '3': 'WED',
  '4': 'THU',
  '5': 'FRI',
  '6': 'SAT',
  '7': 'SUN',
  '0': 'SUN',
};

/**
 * Returns the DayCode ('MON'..'SUN') for a given Date or 'YYYY-MM-DD' string.
 */
export function getDayCodeFromDate(dateOrYMD: Date | string): DayCode {
  if (typeof dateOrYMD === 'string') {
    const parts = dateOrYMD.split('-').map(Number);
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return DAY_INDEX_MAP[d.getDay()];
    }
    const d = new Date(dateOrYMD);
    return DAY_INDEX_MAP[d.getDay()];
  }
  return DAY_INDEX_MAP[dateOrYMD.getDay()];
}

/**
 * Parses a days_of_week string into an array of DayCodes.
 * If empty or 'ALL', returns all 7 days.
 */
export function parseDaysOfWeekString(daysOfWeek: string | undefined | null): DayCode[] {
  if (!daysOfWeek || daysOfWeek === 'ALL') {
    return [...ALL_DAYS];
  }
  const rawTokens = daysOfWeek.toUpperCase().split(',').map((t) => t.trim());
  const resolved: DayCode[] = [];
  for (const t of rawTokens) {
    if ((ALL_DAYS as string[]).includes(t)) {
      resolved.push(t as DayCode);
    } else if (LEGACY_NUM_TO_DAY[t]) {
      resolved.push(LEGACY_NUM_TO_DAY[t]);
    }
  }
  return resolved.length > 0 ? resolved : [...ALL_DAYS];
}

/**
 * Serializes an array of DayCodes into a storage string:
 * - 'ALL' if all 7 days are selected.
 * - Comma-separated sorted codes (e.g. 'MON,WED,FRI') otherwise.
 */
export function serializeDaysOfWeek(days: DayCode[]): string {
  if (!days || days.length === 0 || days.length === 7) {
    return 'ALL';
  }
  // Sort according to ALL_DAYS order (MON -> SUN)
  const sorted = ALL_DAYS.filter((d) => days.includes(d));
  return sorted.join(',');
}

/**
 * Checks whether a given schedule daysOfWeek string includes the target DayCode.
 */
export function isScheduledOnDay(daysOfWeek: string | undefined | null, targetDay: DayCode): boolean {
  if (!daysOfWeek || daysOfWeek === 'ALL') {
    return true;
  }
  const days = parseDaysOfWeekString(daysOfWeek);
  return days.includes(targetDay);
}

/**
 * Returns a human-friendly summary of schedule days (e.g. "Every day", "Weekdays", "Mon, Wed, Fri").
 */
export function formatDaysOfWeekSummary(daysOfWeek: string | undefined | null): string {
  if (!daysOfWeek || daysOfWeek === 'ALL') return 'Every day';
  const tokens = parseDaysOfWeekString(daysOfWeek);
  if (tokens.length === 7) return 'Every day';
  if (tokens.length === 5 && WEEKDAYS.every((d) => tokens.includes(d))) return 'Weekdays';
  if (tokens.length === 2 && WEEKENDS.every((d) => tokens.includes(d))) return 'Weekends';

  const sorted = ALL_DAYS.filter((d) => tokens.includes(d));
  return sorted.map((d) => DAY_LABELS[d]?.short || d).join(', ');
}


