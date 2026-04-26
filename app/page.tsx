'use client';

import { useState, useEffect, useCallback } from 'react';
import WeekNavigator from '@/components/WeekNavigator';
import DayCard from '@/components/DayCard';
import SummaryBar from '@/components/SummaryBar';
import SettingsModal from '@/components/SettingsModal';
import { Button } from '@/components/ui/button';
import {
  getWeekStart,
  getWeekDates,
  getWeekKey,
  navigateWeek,
  getFortnightPair,
  formatFortnightLabel,
} from '@/lib/date-helpers';
import { getDayType } from '@/lib/holidays';
import { calcWeek } from '@/lib/calculations';
import {
  loadSettings,
  loadWeek,
  saveWeek,
  loadCurrentWeekStart,
  saveCurrentWeekStart,
  pruneWeeks,
} from '@/lib/storage';
import { format } from 'date-fns';
import type { WorkDay, Settings } from '@/types';

function buildDefaultWeek(dates: string[]): WorkDay[] {
  return dates.map((date) => ({
    date,
    dayType: getDayType(date),
    startTime: null,
    endTime: null,
    breakMinutes: 60,
  }));
}

export default function Home() {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));
  const [savedIndicator, setSavedIndicator] = useState(false);

  useEffect(() => {
    const stored = loadCurrentWeekStart();
    if (stored) {
      const parsed = new Date(stored + 'T00:00:00');
      if (!isNaN(parsed.getTime())) setWeekStart(parsed);
    }
  }, []);

  useEffect(() => {
    saveCurrentWeekStart(format(weekStart, 'yyyy-MM-dd'));
  }, [weekStart]);
  const [days, setDays] = useState<WorkDay[]>([]);
  const [settings, setSettings] = useState<Settings>({
    weekdayRate: 0,
    weekendMultiplier: 1.25,
    holidayMultiplier: 2.0,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    if (s.weekdayRate === 0) setSettingsOpen(true);
  }, []);

  useEffect(() => {
    const dates = getWeekDates(weekStart);
    const key = getWeekKey(weekStart);
    const saved = loadWeek(key);
    if (saved) {
      setDays(saved.map((d) => ({ ...d, dayType: getDayType(d.date) })));
    } else {
      setDays(buildDefaultWeek(dates));
    }
  }, [weekStart]);

  const handleDayChange = useCallback(
    (index: number, updated: WorkDay) => {
      setDays((prev) => {
        const next = [...prev];
        next[index] = updated;
        saveWeek(getWeekKey(weekStart), next);
        return next;
      });
      setSavedIndicator(true);
      window.setTimeout(() => setSavedIndicator(false), 1200);
    },
    [weekStart]
  );

  const handleNavigate = useCallback((dir: -1 | 1) => {
    setWeekStart((prev) => navigateWeek(prev, dir));
  }, []);

  const handleJumpToday = useCallback(() => {
    setWeekStart(getWeekStart(new Date()));
  }, []);

  const summary = calcWeek(days, settings);

  // Fortnight: sum of the 2 weeks in the current fortnight pair
  const [fnFirst, fnSecond] = getFortnightPair(weekStart);
  const fortnightLabel = formatFortnightLabel(fnFirst, fnSecond);
  const fortnightDays = [fnFirst, fnSecond].flatMap((ws) => {
    const k = getWeekKey(ws);
    if (k === getWeekKey(weekStart)) return days;
    return loadWeek(k) ?? [];
  });
  const fortnightSummary = calcWeek(fortnightDays, settings);

  // Bound storage: keep only current fortnight (2 weeks)
  useEffect(() => {
    pruneWeeks([getWeekKey(fnFirst), getWeekKey(fnSecond)]);
  }, [fnFirst, fnSecond]);

  return (
    <main className="mx-auto max-w-lg pb-24">
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight">Wage Calculator</h1>
          <span
            className={`text-xs text-green-600 dark:text-green-400 transition-opacity ${
              savedIndicator ? 'opacity-100' : 'opacity-0'
            }`}
            aria-live="polite"
          >
            ✓ Saved
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
          ⚙️ Settings
        </Button>
      </div>

      <div className="px-4 pt-4 space-y-3">
        <WeekNavigator
          weekStart={weekStart}
          onNavigate={handleNavigate}
          onJumpToday={handleJumpToday}
        />

        {days.map((day, i) => (
          <DayCard
            key={day.date}
            day={day}
            settings={settings}
            onChange={(updated) => handleDayChange(i, updated)}
          />
        ))}
      </div>

      <SummaryBar
        summary={summary}
        fortnightSummary={fortnightSummary}
        fortnightLabel={fortnightLabel}
        settings={settings}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={setSettings}
      />
    </main>
  );
}
