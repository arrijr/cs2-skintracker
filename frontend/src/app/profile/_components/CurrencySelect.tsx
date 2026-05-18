'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type CurrencyCode = 'EUR' | 'USD' | 'GBP';

const OPTIONS: { value: CurrencyCode; label: string }[] = [
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'GBP', label: 'GBP (£)' },
];

type Props = {
  id?: string;
  value: CurrencyCode;
  onChange: (v: CurrencyCode) => void;
  disabled?: boolean;
};

export function CurrencySelect({ id, value, onChange, disabled }: Props) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as CurrencyCode)} disabled={disabled}>
      <SelectTrigger id={id} aria-label="Preferred currency">
        <SelectValue placeholder="Select currency" />
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
