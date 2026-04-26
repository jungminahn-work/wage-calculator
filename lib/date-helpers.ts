import { startOfISOWeek, addDays, format, addWeeks } from 'date-fns';

export function getWeekStart(date: Date): Date {
  return startOfISOWeek(date);
}

export function getWeekDates(weekStart: Date): string[] {
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStart, i), 'yyyy-MM-dd')
  );
}

export function getWeekKey(weekStart: Date): string {
  // ISO week key e.g. "2026-W17"
  const year = weekStart.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const startOfFirstWeek = startOfISOWeek(jan4);
  const weekNum =
    Math.round((weekStart.getTime() - startOfFirstWeek.getTime()) / (7 * 86400000)) + 1;
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

export function navigateWeek(weekStart: Date, direction: -1 | 1): Date {
  return addWeeks(weekStart, direction);
}

export function formatWeekLabel(weekStart: Date): string {
  const weekEnd = addDays(weekStart, 6);
  const startLabel = format(weekStart, 'MMM d');
  const endLabel = format(weekEnd, 'MMM d, yyyy');
  return `${startLabel} – ${endLabel}`;
}

export function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return format(date, 'EEE d MMM');
}

// Returns [firstWeekStart, secondWeekStart] of the fortnight containing `weekStart`.
// Anchored on the current calendar week (today's ISO week = first week of its fortnight).
export function getFortnightPair(weekStart: Date): [Date, Date] {
  const anchor = startOfISOWeek(new Date());
  const diffWeeks = Math.round((weekStart.getTime() - anchor.getTime()) / (7 * 86400000));
  const pairIndex = Math.floor(diffWeeks / 2);
  const first = addDays(anchor, pairIndex * 14);
  const second = addDays(first, 7);
  return [first, second];
}

export function formatFortnightLabel(first: Date, second: Date): string {
  const end = addDays(second, 6);
  return `${format(first, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
}
