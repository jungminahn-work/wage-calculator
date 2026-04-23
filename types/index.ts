export type DayType = 'weekday' | 'weekend' | 'public_holiday';

export interface WorkDay {
  date: string;             // 'YYYY-MM-DD'
  dayType: DayType;
  startTime: string | null; // 'HH:mm' or null
  endTime: string | null;   // 'HH:mm' or null
  breakMinutes: number;     // 60~150
}

export interface Settings {
  weekdayRate: number;
  weekendMultiplier: number;
  holidayMultiplier: number;
}

export interface WeekSummary {
  totalHours: number;
  totalPay: number;
}

export interface DaySummary {
  hours: number;
  pay: number;
  error?: string;
}
