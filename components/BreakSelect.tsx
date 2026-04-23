'use client';

interface BreakSelectProps {
  value: number;
  onChange: (value: number) => void;
}

const BREAK_OPTIONS = [60, 75, 90, 105, 120, 135, 150];

export default function BreakSelect({ value, onChange }: BreakSelectProps) {
  return (
    <select
      className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      {BREAK_OPTIONS.map((min) => (
        <option key={min} value={min}>
          {min} min
        </option>
      ))}
    </select>
  );
}
