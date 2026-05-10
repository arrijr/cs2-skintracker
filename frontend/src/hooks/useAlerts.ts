"use client";
import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

export interface Alert {
  id: number;
  type: 'price_threshold' | 'volatility' | 'float_tier' | 'case_ev';
  skinId: number | null;
  caseId: number | null;
  config: Record<string, any>;
  channels: string[];
  isActive: boolean;
  cooldownMinutes: number;
  lastTriggeredAt: string | null;
  createdAt: string;
  skin?: { id: number; name: string; imageUrl?: string | null };
  case?: { id: number; name: string };
}

export function useAlerts() {
  const { getToken } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchAlerts = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const res = await fetch(`${apiUrl}/api/v1/alerts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAlerts(data.alerts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, getToken]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const createAlert = async (data: Partial<Alert>) => {
    const token = await getToken();
    const res = await fetch(`${apiUrl}/api/v1/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP ${res.status}`);
    }
    await fetchAlerts();
  };

  const updateAlert = async (id: number, data: Partial<Alert>) => {
    const token = await getToken();
    const res = await fetch(`${apiUrl}/api/v1/alerts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP ${res.status}`);
    }
    await fetchAlerts();
  };

  const deleteAlert = async (id: number) => {
    const token = await getToken();
    const res = await fetch(`${apiUrl}/api/v1/alerts/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok && res.status !== 204) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || `HTTP ${res.status}`);
    }
    await fetchAlerts();
  };

  return { alerts, isLoading, error, refresh: fetchAlerts, createAlert, updateAlert, deleteAlert };
}
