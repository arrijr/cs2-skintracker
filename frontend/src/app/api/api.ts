const BASE_URL = process.env.NEXT_PUBLIC_API_URL; 

function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem("token"); 
  }
  return null;
}

async function apiFetch(path: string, options: RequestInit = {}, auth = false) {
  const url = `${BASE_URL}${path}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    // Optional: Redirect to login on 401
    if (res.status === 401) {
      // z.B. logoutUser(); window.location.href = "/login";
      throw new Error("Not authorized. Please log in again.");
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "API Error");
    return data;
  } catch (err: any) {
    // Zentraler Error-Log
    console.error("API ERROR:", err);
    throw err;
  }
}



// Auth
export function login(email: string, password: string) {
  return apiFetch("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}
export function signup(email: string, password: string) {
  return apiFetch("/users/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// Watchlist
export async function getWatchlist(): Promise<WatchlistEntry[]> {
  return apiFetch("/watchlist", {}, true);
}
export function addToWatchlist(skinId: number, priceAlert?: number) {
  return apiFetch("/watchlist", {
    method: "POST",
    body: JSON.stringify({ skinId, priceAlert }),
  }, true);
}
export function removeFromWatchlist(skinId: number) {
  return apiFetch(`/watchlist/${skinId}`, { method: "DELETE" }, true);
}
export function updatePriceAlert(skinId: number, priceAlert: number) {
  return apiFetch(`/watchlist/${skinId}`, {
    method: "PATCH",
    body: JSON.stringify({ priceAlert }),
  }, true);
}
