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
