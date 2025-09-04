import { getToken, clearAuth } from "./auth";

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

// {/* Core fetch: JWT + 401 Auto-Logout + Fehler-Handling */}
export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers || {}),
  };
  if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`;

  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  console.log(`[DEBUG] apiFetch calling: ${url}`);
  
  const res = await fetch(url, { ...init, headers });
  console.log(`[DEBUG] apiFetch response status: ${res.status}`);

  // {/* Auto-Logout bei abgelaufenem Token */}
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      clearAuth();
      window.location.href = "/login";
      // Return a promise that never resolves to prevent further execution
      return new Promise(() => {});
    }
    throw new Error("Unauthorized"); // This will still be thrown if window is undefined (e.g. SSR)
  }

  // Return the raw response instead of trying to parse JSON
  return res;
}
