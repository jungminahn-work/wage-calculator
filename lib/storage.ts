import type { Settings, WorkDay } from '@/types';

const SETTINGS_KEY = 'wage-calc:settings';
const WEEKS_KEY = 'wage-calc:weeks';
const CURRENT_WEEK_KEY = 'wage-calc:current-week';

export const DEFAULT_SETTINGS: Settings = {
  weekdayRate: 0,
  weekendMultiplier: 1.25,
  holidayMultiplier: 2.0,
  taxCategory: 'resident',
  applyMedicareLevy: true,
  tfnSubmitted: true,
  employerRegistered: true,
};

export function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

type WeeksStore = Record<string, WorkDay[]>;

function loadWeeksStore(): WeeksStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(WEEKS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveWeeksStore(store: WeeksStore): void {
  localStorage.setItem(WEEKS_KEY, JSON.stringify(store));
}

export function loadWeek(weekKey: string): WorkDay[] | null {
  const store = loadWeeksStore();
  return store[weekKey] ?? null;
}

export function saveWeek(weekKey: string, days: WorkDay[]): void {
  const store = loadWeeksStore();
  store[weekKey] = days;
  saveWeeksStore(store);
}

// Keep only the given week keys; remove all others. Used to bound localStorage.
export function pruneWeeks(keepKeys: string[]): void {
  const store = loadWeeksStore();
  const keep = new Set(keepKeys);
  let changed = false;
  for (const k of Object.keys(store)) {
    if (!keep.has(k)) {
      delete store[k];
      changed = true;
    }
  }
  if (changed) saveWeeksStore(store);
}

export function loadCurrentWeekStart(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(CURRENT_WEEK_KEY);
  } catch {
    return null;
  }
}

export function saveCurrentWeekStart(isoDate: string): void {
  try {
    localStorage.setItem(CURRENT_WEEK_KEY, isoDate);
  } catch {
    // ignore
  }
}
