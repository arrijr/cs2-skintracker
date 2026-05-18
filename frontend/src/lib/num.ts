// Number helpers: safe parsing + formatting.
//
// Currency convention:
//   - Steam Market prices are scraped in EUR for our European user base.
//   - All numeric values flowing through the app are EUR-denominated.
//   - `formatUSD` / `formatEUR` are now aliases that format the EUR value in the
//     user's currently-selected display currency (set by CurrencyContext).
//   - Default display currency is EUR. If a user picks USD or GBP in their
//     profile, the same EUR value is multiplied by the FX rate and rendered with
//     the right symbol and locale.

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
// Base currency is EUR (1.0). Rates are EUR → target. Multiply an EUR amount
// by `activeRate` to get the amount in `activeCurrency`.
// -----------------------------------------------------------------------------

type CurrencyCode = "EUR" | "USD" | "GBP";

let activeCurrency: CurrencyCode = "EUR";
let activeRate = 1.0;
let activeLocale = "de-DE";

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
 * Format an EUR-denominated number in the user's preferred display currency.
 * Called from ~29 sites across the app via the legacy `formatUSD` alias.
 */
export function formatEUR(v: unknown, digits = 2): string {
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

/** @deprecated Alias for formatEUR. Kept so existing imports keep working. */
export const formatUSD = formatEUR;

/**
 * Cap absurd percentage display. Cost-basis-against-tiny-buy-price can produce
 * 5000%+ values which look like bugs. Returns "{value}%" or ">999%" / "<-999%"
 * for outliers.
 */
export function formatPctSafe(pct: number, digits = 2): string {
  if (!Number.isFinite(pct)) return "—";
  if (pct > 999) return ">999%";
  if (pct < -999) return "<-999%";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(digits)}%`;
}
