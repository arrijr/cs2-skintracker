// {/* Number helpers: safe parsing + formatting */}

export function numberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.-]+/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function safeToFixed(v: unknown, digits = 2): string {
  const n = numberOrNull(v);
  return n === null ? "—" : n.toFixed(digits);
}

// -----------------------------------------------------------------------------
// Runtime currency config (set by CurrencyContext on mount/change).
//
// `formatUSD` keeps its name for backward compatibility, but now formats the
// amount in the user's preferred currency using a static FX rate. The function
// still treats its input as a USD-denominated value (which is how every
// existing consumer passes data).
// -----------------------------------------------------------------------------

type CurrencyCode = "USD" | "EUR" | "GBP";

let activeCurrency: CurrencyCode = "USD";
let activeRate = 1.0;
let activeLocale = "en-US";

export function setActiveCurrency(
  code: CurrencyCode,
  rate: number,
  locale: string,
): void {
  activeCurrency = code;
  activeRate = rate;
  activeLocale = locale;
}

export function getActiveCurrency(): CurrencyCode {
  return activeCurrency;
}

/**
 * Format a USD-denominated number in the user's preferred currency.
 * Kept as `formatUSD` for backward compatibility across ~29 call sites.
 */
export function formatUSD(v: unknown, digits = 2): string {
  const n = numberOrNull(v);
  if (n === null) return "—";
  const converted = n * activeRate;
  try {
    return new Intl.NumberFormat(activeLocale, {
      style: "currency",
      currency: activeCurrency,
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    }).format(converted);
  } catch {
    const symbol =
      activeCurrency === "EUR" ? "€" : activeCurrency === "GBP" ? "£" : "$";
    return `${symbol}${converted.toFixed(digits)}`;
  }
}
