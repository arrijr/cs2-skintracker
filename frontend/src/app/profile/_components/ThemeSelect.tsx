'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ThemeCode = 'DARK' | 'LIGHT' | 'SYSTEM';

const OPTIONS: { value: ThemeCode; label: string }[] = [
  { value: 'DARK', label: 'Dark' },
  { value: 'LIGHT', label: 'Light (preview only)' },
  { value: 'SYSTEM', label: 'Match system' },
];

type Props = {
  value: ThemeCode;
  onChange: (v: ThemeCode) => void;
  disabled?: boolean;
};

export function ThemeSelect({ value, onChange, disabled }: Props) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as ThemeCode)} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder="Select theme" />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
