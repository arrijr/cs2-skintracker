// frontend/src/lib/api.ts
// Einheitliche URL- und Fetch-Utilities. Nur diese in der App verwenden.

type Env = "production" | "preview" | "development";
const VERCEL_ENV = (process.env.NEXT_PUBLIC_VERCEL_ENV ||
  process.env.VERCEL_ENV ||
  "development") as Env;

// Erlaube explizite DEV/PROD-Origins, fallback auf gemeinsame Variable:
const ORIGIN_DEV =
  process.env.NEXT_PUBLIC_API_ORIGIN_DEV || process.env.NEXT_PUBLIC_API_ORIGIN || "https://cs2-skintracker-dev.onrender.com";
const ORIGIN_PROD =
  process.env.NEXT_PUBLIC_API_ORIGIN_PROD || process.env.NEXT_PUBLIC_API_ORIGIN || "https://cs2-skintracker.onrender.com";

// Auswahl je nach Umgebung: DEV-Backend für Development verwenden
export function apiOrigin() {
  console.log('[API] VERCEL_ENV:', VERCEL_ENV);
  if (VERCEL_ENV === 'development' || VERCEL_ENV === 'preview') {
    console.log('[API] Using DEV backend:', ORIGIN_DEV);
    return ORIGIN_DEV!; // DEV-Backend für Development/Preview
  }
  console.log('[API] Using PROD backend:', ORIGIN_PROD);
  return ORIGIN_PROD!; // PROD-Backend für Production
}

// Baut immer eine absolute URL zum Render-Backend
export function apiUrl(path: string) {
  const base = apiOrigin();
  // tolerantes Joinen ("/api..." vs "api...")
  const p = path.startsWith("/") ? path : `/${path}`;
  // Ensure /api/v1 prefix
  const fullPath = p.startsWith("/api/v1") ? p : `/api/v1${p.startsWith("/api") ? p.substring(4) : p}`;
  return new URL(fullPath, base).toString();
}

// Einheitlicher JSON-Fetcher mit Fehlerobjekt
export async function fetchJson<T = unknown>(
  input: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    // Include credentials for CORS
    credentials: "include",
  });

  if (!res.ok) {
    // Versuch, JSON-Fehler zu lesen
    let detail: unknown = null;
    try {
      detail = await res.json();
    } catch {
      // noop
    }
    const err = new Error(
      `HTTP ${res.status} ${res.statusText} for ${input}`
    ) as Error & { detail?: unknown; status?: number };
    err.detail = detail;
    err.status = res.status;
    throw err;
  }
  // 204?
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// SWR-kompatibler Fetcher
export const swrFetcher = (key: string) => fetchJson(key);

// Authentifizierter SWR-Fetcher (für React Components)
export function createAuthenticatedFetcher(getToken: () => Promise<string | null>) {
  return async (key: string) => {
    const token = await getToken();
    
    return fetchJson(key, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
  };
}

// API-Funktionen für verschiedene Endpoints
export async function searchSkins(query: string) {
  return fetchJson(apiUrl(`/api/v1/skins/search?query=${encodeURIComponent(query)}`));
}

export async function getWatchlist(token?: string) {
  return fetchJson(apiUrl('/api/v1/watchlist'), {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}

export async function addToWatchlist(skinId: number) {
  return fetchJson(apiUrl('/api/v1/watchlist'), {
    method: 'POST',
    body: JSON.stringify({ skinId })
  });
}

export async function removeFromWatchlist(skinId: number) {
  return fetchJson(apiUrl(`/api/v1/watchlist/${skinId}`), {
    method: 'DELETE'
  });
}

export async function updatePriceAlert(skinId: number, priceAlert: number) {
  return fetchJson(apiUrl(`/api/v1/watchlist/${skinId}`), {
    method: 'PATCH',
    body: JSON.stringify({ priceAlert })
  });
}

export async function getPortfolio(token?: string) {
  return fetchJson(apiUrl('/api/v1/portfolio'), {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}

export async function getPortfolioHistory() {
  return fetchJson(apiUrl('/api/v1/portfolio/history'));
}

export async function deletePortfolioEntry(entryId: number, token?: string) {
  return fetchJson(apiUrl(`/api/v1/portfolio/${entryId}`), {
    method: 'DELETE',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
}

// Generic API fetch function
export async function apiFetch(path: string, options: RequestInit = {}) {
  return fetchJson(apiUrl(path), options);
}

// Alias für bessere Kompatibilität
export const apiUpdatePriceAlert = updatePriceAlert;
export const apiRemoveFromWatchlist = removeFromWatchlist;