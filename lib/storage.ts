import type { Settings, WorkDay } from '@/types';

const SETTINGS_KEY = 'wage-calc:settings';
const WEEKS_KEY = 'wage-calc:weeks';

export const DEFAULT_SETTINGS: Settings = {
  weekdayRate: 0,
  weekendMultiplier: 1.25,
  holidayMultiplier: 2.0,
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
