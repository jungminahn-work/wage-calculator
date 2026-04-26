export type DayType = 'weekday' | 'weekend' | 'public_holiday';

export interface WorkDay {
  date: string;             // 'YYYY-MM-DD'
  dayType: DayType;
  startTime: string | null; // 'HH:mm' or null
  endTime: string | null;   // 'HH:mm' or null
  breakMinutes: number;     // 60~150
}

export type TaxCategory = 'resident' | 'whm' | 'foreign_resident';

export interface Settings {
  weekdayRate: number;
  weekendMultiplier: number;
  holidayMultiplier: number;
  taxCategory: TaxCategory;
  applyMedicareLevy: boolean;   // resident only
  tfnSubmitted: boolean;        // whm only
  employerRegistered: boolean;  // whm only
}

export interface WeekSummary {
  totalHours: number;
  totalPay: number;       // gross
  estimatedTax: number;
  netPay: number;
}

export interface DaySummary {
  hours: number;
  pay: number;
  error?: string;
}
