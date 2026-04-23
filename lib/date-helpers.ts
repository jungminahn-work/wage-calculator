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
