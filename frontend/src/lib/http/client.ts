// frontend/src/lib/http/client.ts
'use client';

import { Clerk } from '@clerk/clerk-js';

export type UiError = { message: string; status?: number; cause?: unknown };
export type ErrorSetter = (err: UiError | null) => void;

let errorSetter: ErrorSetter | null = null;

/** Von der UI gesetzt, damit der HTTP-Layer Fehler melden kann. */
export function setErrorContext(setter: ErrorSetter) {
  errorSetter = setter;
}

/** Optional: Token via Clerk Session (Template "backend") anhängen */
async function authHeader(): Promise<Record<string, string>> {
  try {
    // lazy init – nur im Browser
    const clerk = new Clerk(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!);
    // Clerk initialisiert sich automatisch in Next 15; Token kann null sein
    // @ts-ignore – getToken existiert im Browser-Client
    const token: string | null = await clerk.session?.getToken?.({ template: 'backend' });
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/** Einheitlicher Fetch mit Fehlerweitergabe an die UI */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(init.headers || {});
  // JSON default
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  // Auth (falls vorhanden)
  const auth = await authHeader();
  Object.entries(auth).forEach(([k, v]) => headers.set(k, v));

  try {
    const res = await fetch(input, { ...init, headers, credentials: 'include' });

    if (!res.ok) {
      let message = res.statusText;
      try {
        const text = await res.text();
        message = text || message;
      } catch {}
      const err: UiError = { message, status: res.status };
      errorSetter?.(err);
      throw new Error(message);
    }
    return res;
  } catch (cause) {
    const err: UiError = { message: (cause as Error)?.message ?? 'Network error', cause };
    errorSetter?.(err);
    throw cause;
  }
}