import type { WorkDay, Settings, DaySummary, WeekSummary } from '@/types';
import { estimateWeeklyTax } from './tax';

export function calcDay(day: WorkDay, settings: Settings): DaySummary {
  if (!day.startTime || !day.endTime) {
    return { hours: 0, pay: 0 };
  }

  const [sh, sm] = day.startTime.split(':').map(Number);
  const [eh, em] = day.endTime.split(':').map(Number);
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  if (endMinutes <= startMinutes) {
    return { hours: 0, pay: 0, error: 'End time must be after start time' };
  }

  const workedMinutes = endMinutes - startMinutes - day.breakMinutes;
  if (workedMinutes < 0) {
    return { hours: 0, pay: 0, error: 'Break is longer than shift' };
  }

  const hours = workedMinutes / 60;
  const multiplier =
    day.dayType === 'public_holiday'
      ? settings.holidayMultiplier
      : day.dayType === 'weekend'
      ? settings.weekendMultiplier
      : 1;

  const pay = hours * settings.weekdayRate * multiplier;
  return { hours, pay };
}

export function calcWeek(days: WorkDay[], settings: Settings): WeekSummary {
  const summaries = days.map((d) => calcDay(d, settings));
  const totalHours = summaries.reduce((acc, s) => acc + s.hours, 0);
  const totalPay = summaries.reduce((acc, s) => acc + s.pay, 0);
  const estimatedTax = estimateWeeklyTax(totalPay, settings);
  return {
    totalHours,
    totalPay,
    estimatedTax,
    netPay: Math.max(0, totalPay - estimatedTax),
  };
}

export function formatHours(hours: number): string {
  return `${hours.toFixed(2).replace(/\.00$/, '')}h`;
}

export function formatPay(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
