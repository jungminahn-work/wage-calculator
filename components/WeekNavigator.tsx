'use client';

import { formatWeekLabel, getWeekStart } from '@/lib/date-helpers';
import { isSameDay } from 'date-fns';

interface WeekNavigatorProps {
  weekStart: Date;
  onNavigate: (direction: -1 | 1) => void;
  onJumpToday: () => void;
}

export default function WeekNavigator({ weekStart, onNavigate, onJumpToday }: WeekNavigatorProps) {
  const isCurrentWeek = isSameDay(weekStart, getWeekStart(new Date()));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 rounded-lg bg-muted px-4 py-2">
        <button
          onClick={() => onNavigate(-1)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
          aria-label="Previous week"
        >
          ←
        </button>
        <span className="text-sm font-medium text-foreground">
          {formatWeekLabel(weekStart)}
        </span>
        <button
          onClick={() => onNavigate(1)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
          aria-label="Next week"
        >
          →
        </button>
      </div>
      {!isCurrentWeek && (
        <button
          onClick={onJumpToday}
          className="w-full rounded-md border border-border bg-background py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          ↺ This week
        </button>
      )}
    </div>
  );
}
