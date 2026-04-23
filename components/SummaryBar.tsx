'use client';

import { formatHours, formatPay } from '@/lib/calculations';
import type { WeekSummary, Settings } from '@/types';

interface SummaryBarProps {
  summary: WeekSummary;
  settings: Settings;
}

export default function SummaryBar({ summary, settings }: SummaryBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">This week</span>
          <span className="font-semibold text-foreground">{formatHours(summary.totalHours)}</span>
        </div>
        {settings.weekdayRate > 0 ? (
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatPay(summary.totalPay)}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Set hourly rate in settings</span>
        )}
      </div>
    </div>
  );
}
