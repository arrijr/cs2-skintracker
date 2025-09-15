// frontend/src/lib/http/server.ts — [Frontend]
// {/* Server-only HTTP client with Clerk JWT Authentication */}
import 'server-only';
import { cookies } from 'next/headers';
import { auth } from '@clerk/nextjs/server';

const BASE_URL = process.env.NEXT_PUBLIC_API_ORIGIN ?? 'https://cs2-skintracker.onrender.com';

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const { sessionId, getToken } = auth();

  // Hole Backend-Template-Token von Clerk (Template-Name: "backend")
  const token = await getToken({ template: 'backend' }).catch(() => null);

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers, cache: 'no-store' });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${init.method ?? 'GET'} ${path} failed: ${res.status} ${body}`);
  }
  return res.json();
}