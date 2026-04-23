'use client';

interface TimeSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
}

function generateTimes(): string[] {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
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
