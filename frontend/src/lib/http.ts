export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

// {/* Safe token getter */}
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

// {/* Core fetch: JWT + 401 Auto-Logout + Fehler-Handling */}
export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { ...init, headers });

  // {/* Auto-Logout bei abgelaufenem Token */}
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
      // Return a promise that never resolves to prevent further execution
      return new Promise(() => {});
    }
    throw new Error("Unauthorized"); // This will still be thrown if window is undefined (e.g. SSR)
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      msg = j?.message || j?.error || msg;
    } catch {}
    throw new Error(msg);
  }

  try {
    return await res.json();
  } catch {
    return { ok: false, error: "Failed to parse response" };
  }
}
