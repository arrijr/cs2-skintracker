"use client";

import { useState, ChangeEvent } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiUrl, fetchJson } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ServerCog, Database, HardDrive, Play, Rocket } from "lucide-react";

type JobRunResponse = {
  success: boolean;
  dryRun: boolean;
  jobRunId?: number | string;
  message?: string;
  estimatedImpact?: string;
};

export default function AdminControls() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [take, setTake] = useState<number>(50);
  const [dryRun, setDryRun] = useState<boolean>(true);

  async function authFetch(path: string, init?: RequestInit) {
    const token = await getToken({ template: "backend" });
    return fetchJson(apiUrl(path), {
      ...init,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(init?.headers || {}),
      },
    });
  }

  async function runSkinPrices() {
    setLoading("skin");
    setMessage(null);
    setError(null);
    try {
      const res = (await authFetch("/api/v1/admin/jobs/skin-prices", {
        method: "POST",
        body: JSON.stringify({ take, dryRun }),
      })) as JobRunResponse;
      setMessage(res.message || (res.success ? "OK" : ""));
    } catch (e: any) {
      setError(e?.detail?.error || e?.message || "Failed to run skin price update");
    } finally {
      setLoading(null);
    }
  }

  async function runPortfolioSnapshots() {
    setLoading("portfolio");
    setMessage(null);
    setError(null);
    try {
      const res = (await authFetch("/api/v1/admin/jobs/portfolio-snapshots", {
        method: "POST",
        body: JSON.stringify({ batchSize: 100, dryRun }),
      })) as JobRunResponse;
      setMessage(res.message || (res.success ? "OK" : ""));
    } catch (e: any) {
      setError(e?.detail?.error || e?.message || "Failed to run portfolio snapshots");
    } finally {
      setLoading(null);
    }
  }

  async function runAlertCheck() {
    setLoading("alerts");
    setMessage(null);
    setError(null);
    try {
      const res = (await authFetch("/api/v1/admin/jobs/alert-check", {
        method: "POST",
        body: JSON.stringify({ limit: 100, optInOnly: true, dryRun }),
      })) as JobRunResponse;
      setMessage(res.message || (res.success ? "OK" : ""));
    } catch (e: any) {
      setError(e?.detail?.error || e?.message || "Failed to run alert check");
    } finally {
      setLoading(null);
    }
  }

  async function clearSteamCache() {
    setLoading("cache");
    setMessage(null);
    setError(null);
    try {
      const res = (await authFetch("/api/v1/admin/cache/steam/clear", {
        method: "POST",
      })) as { success: boolean; message?: string };
      setMessage(res.message || (res.success ? "Cache cleared" : ""));
    } catch (e: any) {
      setError(e?.detail?.error || e?.message || "Failed to clear cache");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Admin Controls */}
      <Card className="card-enhanced hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {/* Admin Controls */}
            <ServerCog className="w-5 h-5" />
            Admin Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="take">Take (skins per run)</Label>
              <Input
                id="take"
                type="number"
                value={take}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTake(parseInt(e.target.value || "0", 10))}
                min={1}
                max={1000}
              />
              <div className="text-xs text-muted-foreground">
                Dry Run: <Badge variant="outline">{dryRun ? "ON" : "OFF"}</Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => setDryRun((v: boolean) => !v)}
                >
                  Toggle
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button onClick={runSkinPrices} disabled={loading !== null} className="btn-enhanced">
              {loading === "skin" ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Rocket className="w-4 h-4 mr-2" />
              )}
              Run Skin Price Update
            </Button>

            <Button onClick={runPortfolioSnapshots} disabled={loading !== null} className="btn-enhanced" variant="outline">
              {loading === "portfolio" ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Database className="w-4 h-4 mr-2" />
              )}
              Rebuild Portfolio Snapshots
            </Button>

            <Button onClick={runAlertCheck} disabled={loading !== null} className="btn-enhanced" variant="outline">
              {loading === "alerts" ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Run Alert Check
            </Button>

            <Button onClick={clearSteamCache} disabled={loading !== null} className="btn-enhanced" variant="destructive">
              {loading === "cache" ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <HardDrive className="w-4 h-4 mr-2" />
              )}
              Clear Steam Cache
            </Button>
          </div>

          {(message || error) && (
            <div
              className={`mt-2 p-3 rounded-md border ${
                error
                  ? "bg-red-500/10 text-red-300 border-red-500/30"
                  : "bg-green-500/10 text-green-300 border-green-500/30"
              }`}
            >
              {error || message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

