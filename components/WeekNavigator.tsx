'use client';

import { formatWeekLabel } from '@/lib/date-helpers';

interface WeekNavigatorProps {
  weekStart: Date;
  onNavigate: (direction: -1 | 1) => void;
}

export default function WeekNavigator({ weekStart, onNavigate }: WeekNavigatorProps) {
  return (
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
  );
}
