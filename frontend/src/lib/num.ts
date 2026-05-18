// Number helpers: safe parsing + formatting.
// App-wide currency convention: EUR (€) — Steam Market prices are scraped in EUR for our European user base.
// formatUSD is kept as an alias for backwards compatibility but now formats EUR.

export function numberOrNull(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.-]+/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function safeToFixed(v: unknown, digits = 2): string {
  const n = numberOrNull(v);
  return n === null ? "—" : n.toFixed(digits);
}

/** Canonical currency formatter — use this everywhere. */
export function formatEUR(v: unknown, digits = 2): string {
  const n = numberOrNull(v);
  if (n === null) return "—";
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: digits,
      minimumFractionDigits: digits,
    }).format(n);
  } catch {
    return `€${n.toFixed(digits)}`;
  }
}

/** @deprecated Alias for formatEUR. Existing imports keep working; new code should use formatEUR. */
export const formatUSD = formatEUR;

/**
 * Cap absurd percentage display. Cost-basis-against-tiny-buy-price can produce 5000%+ values
 * which look like bugs. Returns "{value}%" or ">999%" / "<-999%" for outliers.
 */
export function formatPctSafe(pct: number, digits = 2): string {
  if (!Number.isFinite(pct)) return "—";
  if (pct > 999) return ">999%";
  if (pct < -999) return "<-999%";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(digits)}%`;
}
