'use client';

import { formatHours, formatPay } from '@/lib/calculations';
import type { WeekSummary, Settings } from '@/types';

interface SummaryBarProps {
  summary: WeekSummary;
  fortnightSummary: WeekSummary;
  fortnightLabel: string;
  settings: Settings;
}

export default function SummaryBar({
  summary,
  fortnightSummary,
  fortnightLabel,
  settings,
}: SummaryBarProps) {
  const hasRate = settings.weekdayRate > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto max-w-lg px-4 py-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">This week</span>
            <span className="text-sm font-semibold text-foreground">
              {formatHours(summary.totalHours)}
            </span>
          </div>
          {hasRate ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Gross</span>
              <span className="font-semibold">{formatPay(summary.totalPay)}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">Tax</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                −{formatPay(summary.estimatedTax)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Set hourly rate in settings</span>
          )}
        </div>

        {hasRate && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">After tax (Net)</span>
            <span className="text-base font-bold text-green-600 dark:text-green-400">
              {formatPay(summary.netPay)}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-1">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground">Fortnight</span>
            <span className="text-[10px] text-muted-foreground/70">{fortnightLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {formatHours(fortnightSummary.totalHours)}
            </span>
            {hasRate && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                  {formatPay(fortnightSummary.netPay)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
