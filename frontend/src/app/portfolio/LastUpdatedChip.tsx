"use client";
import { useState, useEffect } from "react";
import { RefreshCw, Clock } from "lucide-react";

type Props = {
  token: string | null;
  onRefresh?: () => void;
};

type LastUpdatedData = {
  timestamp: string;
  source: 'health' | 'portfolio' | 'fallback';
};

export default function LastUpdatedChip({ token, onRefresh }: Props) {
  const [lastUpdated, setLastUpdated] = useState<LastUpdatedData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Feature flags
  const CHIP_ENABLED = process.env.NEXT_PUBLIC_PORTFOLIO_LASTUPDATED_CHIP !== 'false'; // Default ON
  const AUTOREFRESH_ENABLED = process.env.NEXT_PUBLIC_PORTFOLIO_AUTOREFRESH === 'true'; // Default OFF

  const loadLastUpdated = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      // Try health endpoint first (no auth required)
      const healthResponse = await fetch("/api/v1/health/cron-status");

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        if (healthData.priceHistoryLastRun) {
          setLastUpdated({
            timestamp: healthData.priceHistoryLastRun,
            source: 'health'
          });
          return;
        }
      }

      // Fallback: use current time as portfolio data timestamp
      setLastUpdated({
        timestamp: new Date().toISOString(),
        source: 'portfolio'
      });

    } catch (err: any) {
      setError(err?.message || "Failed to load last updated");
      // Fallback to current time
      setLastUpdated({
        timestamp: new Date().toISOString(),
        source: 'fallback'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      onRefresh();
    }
    await loadLastUpdated();
  };

  // Auto-refresh every 15 minutes if enabled
  useEffect(() => {
    if (!AUTOREFRESH_ENABLED) return;

    const interval = setInterval(() => {
      loadLastUpdated();
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, [AUTOREFRESH_ENABLED]);

  // Load on mount
  useEffect(() => {
    loadLastUpdated();
  }, [token]);

  if (!CHIP_ENABLED) {
    return null;
  }

  if (!lastUpdated) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Clock className="w-4 h-4" />
        <span>Last updated: —</span>
      </div>
    );
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes}m ago`;
      } else {
        return 'Just now';
      }
    } catch {
      return 'Unknown';
    }
  };

  const isStale = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours > 48; // 48 hours threshold
    } catch {
      return false;
    }
  };

  const stale = isStale(lastUpdated.timestamp);

  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
        stale 
          ? 'bg-red-600/20 text-red-400 border border-red-600/40' 
          : 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/40'
      }`}>
        <Clock className="w-4 h-4" />
        <span>
          Last updated: {formatTimestamp(lastUpdated.timestamp)}
          {stale && <span className="ml-1 text-xs">(Stale)</span>}
        </span>
      </div>

      <button
        onClick={handleRefresh}
        disabled={loading}
        className={`p-2 rounded-full transition-colors ${
          loading 
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
        title="Refresh portfolio data"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </button>

      {AUTOREFRESH_ENABLED && (
        <div className="text-xs text-gray-500">
          Auto-refresh: 15min
        </div>
      )}

      {error && (
        <div className="text-xs text-red-400">
          Error: {error}
        </div>
      )}
    </div>
  );
}
