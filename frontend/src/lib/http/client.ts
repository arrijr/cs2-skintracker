// frontend/src/lib/http/client.ts — [Frontend]
// {/* Client-only HTTP client with Clerk JWT Authentication */}
'use client';

import { Clerk } from '@clerk/clerk-js';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://cs2-skintracker.onrender.com';

async function getClerkToken(): Promise<string | null> {
  // Robust: globales Clerk-Objekt oder @clerk/clerk-js
  const token =
    (await window?.Clerk?.session?.getToken({ template: 'backend' })) ??
    (await new Clerk(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!).session?.getToken({
      template: 'backend',
    }));
  return token ?? null;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');

  const token = await getClerkToken().catch(() => null);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${init.method ?? 'GET'} ${path} failed: ${res.status} ${body}`);
  }
  return res.json();
}