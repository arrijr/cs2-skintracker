// frontend/src/lib/strings.ts — [Frontend]
// {/* Defensive string helpers to prevent toLowerCase() crashes */}

export const safeLower = (v: unknown): string =>
  (typeof v === 'string' ? v : (v ?? '') + '').toLowerCase();

export const safeString = (v: unknown): string =>
  typeof v === 'string' ? v : (v ?? '') + '';

export const safeIncludes = (haystack: unknown, needle: string): boolean => {
  const safeHaystack = safeString(haystack);
  return safeHaystack.toLowerCase().includes(needle.toLowerCase());
};

export const safeStartsWith = (str: unknown, prefix: string): boolean => {
  const safeStr = safeString(str);
  return safeStr.toLowerCase().startsWith(prefix.toLowerCase());
};

export const safeEndsWith = (str: unknown, suffix: string): boolean => {
  const safeStr = safeString(str);
  return safeStr.toLowerCase().endsWith(suffix.toLowerCase());
};

export const safeLocaleCompare = (a: unknown, b: unknown): number => {
  const safeA = safeString(a);
  const safeB = safeString(b);
  return safeA.localeCompare(safeB);
};

// Generic safe function for any string operation
export const safe = (v: unknown): string => (typeof v === 'string' ? v : v == null ? "" : String(v));
