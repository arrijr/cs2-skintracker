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

export function formatUSD(v: unknown, digits = 2): string {
  const n = numberOrNull(v);
  if (n === null) return "—";
  try {
    return new Intl.NumberFormat("en-US", { 
      style: "currency", 
      currency: "USD", 
      maximumFractionDigits: digits, 
      minimumFractionDigits: digits 
    }).format(n);
  } catch {
    return `$${n.toFixed(digits)}`;
  }
}
