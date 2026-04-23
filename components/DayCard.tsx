'use client';

import TimeSelect from './TimeSelect';
import BreakSelect from './BreakSelect';
import { calcDay, formatHours, formatPay } from '@/lib/calculations';
import { formatDayLabel } from '@/lib/date-helpers';
import { getHolidayName } from '@/lib/holidays';
import type { WorkDay, Settings } from '@/types';

interface DayCardProps {
  day: WorkDay;
  settings: Settings;
  onChange: (updated: WorkDay) => void;
}

const DAY_TYPE_LABELS: Record<WorkDay['dayType'], string> = {
  weekday: 'Weekday',
  weekend: 'Weekend ×1.25',
  public_holiday: 'Public Holiday ×2.0',
};

const DAY_TYPE_COLORS: Record<WorkDay['dayType'], string> = {
  weekday: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  weekend: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  public_holiday: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export default function DayCard({ day, settings, onChange }: DayCardProps) {
  const summary = calcDay(day, settings);
  const hasInput = day.startTime && day.endTime;
  const holidayName = getHolidayName(day.date);

  function update(patch: Partial<WorkDay>) {
    onChange({ ...day, ...patch });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-foreground">{formatDayLabel(day.date)}</span>
          {holidayName && (
            <span className="ml-2 text-xs text-muted-foreground">({holidayName})</span>
          )}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${DAY_TYPE_COLORS[day.dayType]}`}
        >
          {DAY_TYPE_LABELS[day.dayType]}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Start</label>
          <TimeSelect
            value={day.startTime}
            onChange={(v) => update({ startTime: v })}
            placeholder="--:--"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">End</label>
          <TimeSelect
            value={day.endTime}
            onChange={(v) => update({ endTime: v })}
            placeholder="--:--"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Break</label>
          <BreakSelect value={day.breakMinutes} onChange={(v) => update({ breakMinutes: v })} />
        </div>
      </div>

      {summary.error && (
        <p className="mt-2 text-xs text-red-500">{summary.error}</p>
      )}

      {hasInput && !summary.error && (
        <div className="mt-3 flex items-center justify-end gap-2 text-sm">
          <span className="font-medium text-foreground">{formatHours(summary.hours)}</span>
          {settings.weekdayRate > 0 && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {formatPay(summary.pay)}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
