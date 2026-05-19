"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export interface SteamStatus {
  connected: boolean;
  steamId: string | null;
  steamConnectedAt: string | null;
  lastImportedAt: string | null;
}

export interface MatchedItem {
  kind: 'skin' | 'case' | 'market_item';
  skinId: number | null;
  caseId: number | null;
  marketItemId: number | null;
  marketHashName: string;
  name: string;
  amount: number;
  tradable: boolean;
  marketable: boolean;
  currentPrice: number | null;
}

export interface SkippedItem {
  marketHashName: string;
  amount: number;
  reason: string;
}

export interface PreviewResult {
  totals: { fetched: number; matched: number; skipped: number };
  matched: MatchedItem[];
  skipped: SkippedItem[];
}

export type CostBasisMode = 'empty' | 'current_market' | 'custom';
export interface CustomCostBasis { skinId: number; buyPrice: number | null; buyDate: Date | null; }

export function useSteamConnection() {
  const { getToken } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const [status, setStatus] = useState<SteamStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`${apiUrl}/api/v1/steam/status`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Steam status");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, getToken]);

  useEffect(() => { refresh(); }, [refresh]);

  const connect = useCallback(async () => {
    // Use POST /connect/start with Authorization header so the Clerk JWT
    // never appears in the URL / referer / proxy access logs (Task 4).
    const token = await getToken();
    const res = await fetch(`${apiUrl}/api/v1/steam/connect/start`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    const { url } = await res.json();
    window.location.href = url;
  }, [apiUrl, getToken]);

  const disconnect = useCallback(async () => {
    const token = await getToken();
    const res = await fetch(`${apiUrl}/api/v1/steam/disconnect`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await refresh();
  }, [apiUrl, getToken, refresh]);

  const preview = useCallback(async (): Promise<PreviewResult> => {
    const token = await getToken();
    const res = await fetch(`${apiUrl}/api/v1/steam/inventory/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return await res.json();
  }, [apiUrl, getToken]);

  const importNow = useCallback(async (mode: CostBasisMode, custom?: Array<{ skinId: number; buyPrice: number | null; buyDate: string | null }>) => {
    const token = await getToken();
    const res = await fetch(`${apiUrl}/api/v1/steam/inventory/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ costBasisMode: mode, custom }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    await refresh();
    return data as { created: number; matched: number; skipped: number };
  }, [apiUrl, getToken, refresh]);

  return { status, loading, error, refresh, connect, disconnect, preview, importNow };
}
