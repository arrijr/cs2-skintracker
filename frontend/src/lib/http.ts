import { auth } from "@clerk/nextjs/server";

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

// {/* Core fetch: Clerk Bearer Token + 401 Auto-Logout + Fehler-Handling */}
export async function apiFetch(path: string, init: RequestInit = {}) {
  // Get Clerk token for client-side requests
  let token: string | null = null;
  
  if (typeof window !== "undefined") {
    // Client-side: Clerk handles authentication automatically
    // The backend will verify the Clerk session token
      token = null;
    } catch (error) {
      console.warn("Failed to get Clerk token on client-side:", error);
    }
  }

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
      // Redirect to sign-in page
      window.location.href = "/sign-in";
      // Return a promise that never resolves to prevent further execution
      return new Promise(() => {});
    }
    throw new Error("Unauthorized"); // This will still be thrown if window is undefined (e.g. SSR)
  }

  // Parse JSON and return data
  try {
    const data = await res.json();
    return { ok: res.ok, status: res.status, ...data };
  } catch (error) {
    return { ok: res.ok, status: res.status, error: "Failed to parse response" };
  }
}
