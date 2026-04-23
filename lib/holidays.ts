import holidayData from '@/data/public-holidays.json';
import type { DayType } from '@/types';

type HolidayData = Record<string, { date: string; name: string }[]>;

const holidays = holidayData as HolidayData;

function getHolidaySet(year: number): Set<string> {
  const list = holidays[String(year)] ?? [];
  return new Set(list.map((h) => h.date));
}

export function getDayType(dateStr: string): DayType {
  const date = new Date(dateStr + 'T00:00:00');
  const year = date.getFullYear();
  const holidaySet = getHolidaySet(year);

  if (holidaySet.has(dateStr)) return 'public_holiday';

  const dow = date.getDay(); // 0=Sun, 6=Sat
  if (dow === 0 || dow === 6) return 'weekend';

  return 'weekday';
}

export function getHolidayName(dateStr: string): string | null {
  const date = new Date(dateStr + 'T00:00:00');
  const year = date.getFullYear();
  const list = holidays[String(year)] ?? [];
  return list.find((h) => h.date === dateStr)?.name ?? null;
}
