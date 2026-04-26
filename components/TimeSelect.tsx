'use client';

interface TimeSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}

function generateTimes(): string[] {
  // 10:00 ~ 21:30, 15-minute intervals
  const times: string[] = [];
  const startMinutes = 10 * 60;
  const endMinutes = 21 * 60 + 30;
  for (let m = startMinutes; m <= endMinutes; m += 15) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    times.push(`${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`);
  }
  return times;
}

const TIMES = generateTimes();

export default function TimeSelect({ value, onChange, placeholder = 'Start' }: TimeSelectProps) {
  return (
    <select
      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">{placeholder}</option>
      {TIMES.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}
