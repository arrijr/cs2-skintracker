'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { setActiveCurrency } from '@/lib/num';

type CurrencyCode = 'USD' | 'EUR' | 'GBP';

const FX_RATES: Record<CurrencyCode, number> = { USD: 1.0, EUR: 0.92, GBP: 0.79 };
const SYMBOLS: Record<CurrencyCode, string> = { USD: '$', EUR: '€', GBP: '£' };
const LOCALES: Record<CurrencyCode, string> = { USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB' };

type CurrencyContextValue = {
  currency: CurrencyCode;
  symbol: string;
  rate: number;
  format: (usdAmount: number | null | undefined, opts?: { decimals?: number }) => string;
  refresh: () => Promise<void>;
  isLoading: boolean;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrency = useCallback(async () => {
    if (!isSignedIn) {
      setCurrency('USD');
      setIsLoading(false);
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.preferredCurrency && data.preferredCurrency in FX_RATES) {
          setCurrency(data.preferredCurrency as CurrencyCode);
        }
      }
    } catch (err) {
      console.error('CurrencyContext fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    fetchCurrency();
  }, [fetchCurrency]);

  // Push current currency settings into the lib/num module-level state so the
  // legacy formatUSD() helper (used by ~29 components) renders in the user's
  // preferred currency without touching every call site.
  useEffect(() => {
    setActiveCurrency(currency, FX_RATES[currency], LOCALES[currency]);
  }, [currency]);

  const format = useCallback(
    (usdAmount: number | null | undefined, opts?: { decimals?: number }) => {
      const decimals = opts?.decimals ?? 2;
      const amount = typeof usdAmount === 'number' && Number.isFinite(usdAmount) ? usdAmount : 0;
      const converted = amount * FX_RATES[currency];
      try {
        return new Intl.NumberFormat(LOCALES[currency], {
          style: 'currency',
          currency,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(converted);
      } catch {
        return `${SYMBOLS[currency]}${converted.toFixed(decimals)}`;
      }
    },
    [currency]
  );

  const value: CurrencyContextValue = {
    currency,
    symbol: SYMBOLS[currency],
    rate: FX_RATES[currency],
    format,
    refresh: fetchCurrency,
    isLoading,
  };

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used inside CurrencyProvider');
  return ctx;
}
