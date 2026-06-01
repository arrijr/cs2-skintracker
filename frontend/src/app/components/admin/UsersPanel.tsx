"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { apiUrl, fetchJson } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TierBadge } from "@/components/ui/tier-badge";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, RefreshCw, Search, Crown, Mail, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";

type Tier = "free" | "lite" | "pro";

interface AdminUser {
  id: number;
  email: string;
  displayName: string | null;
  role: string;
  tier: Tier | null;
  isPremium: boolean;
  emailAlerts: boolean;
  createdAt: string;
  portfolioCount: number;
  watchlistCount: number;
}

interface UserStats {
  totalUsers: number;
  premiumUsers: number;
  usersWithPortfolios: number;
  usersWithWatchlists: number;
  emailAlertsEnabled: number;
  newUsers30Days: number;
  newUsers7Days: number;
  premiumUserPercentage: number;
  portfolioUserPercentage: number;
}

interface UsersResponse {
  users: AdminUser[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const LIMIT = 20;

export default function UsersPanel() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [writeDisabled, setWriteDisabled] = useState(false);

  const authFetch = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const token = await getToken({ template: "backend" });
      return fetchJson<T>(apiUrl(path), {
        ...init,
        headers: { ...(token && { Authorization: `Bearer ${token}` }), ...(init?.headers || {}) },
      });
    },
    [getToken],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = `page=${page}&limit=${LIMIT}${search ? `&search=${encodeURIComponent(search)}` : ""}`;
      const [statsRes, usersRes] = await Promise.all([
        authFetch<UserStats>("/api/v1/admin/users/statistics"),
        authFetch<UsersResponse>(`/api/v1/admin/users?${q}`),
      ]);
      setStats(statsRes);
      setUsers(usersRes.users || []);
      setTotalPages(usersRes.pagination?.totalPages || 1);
      setTotal(usersRes.pagination?.total || 0);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [authFetch, page, search]);

  useEffect(() => {
    load();
  }, [load]);

  // Apply an action, patch the row in place on success, surface the prod-write gate.
  const mutate = async (userId: number, path: string, body: object, patch: Partial<AdminUser>) => {
    setBusyId(userId);
    try {
      await authFetch(path, { method: "PATCH", body: JSON.stringify(body) });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...patch } : u)));
    } catch (e) {
      const status = (e as { status?: number })?.status;
      if (status === 403) setWriteDisabled(true);
      else setError("Action failed");
    } finally {
      setBusyId(null);
    }
  };

  const setTier = (u: AdminUser, tier: Tier) =>
    mutate(u.id, `/api/v1/admin/users/${u.id}/tier`, { tier }, { tier, isPremium: tier !== "free" });

  const toggleEmailAlerts = (u: AdminUser) =>
    mutate(
      u.id,
      `/api/v1/admin/users/${u.id}/email-alerts`,
      { emailAlerts: !u.emailAlerts },
      { emailAlerts: !u.emailAlerts },
    );

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const statCards = stats
    ? [
        { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, accent: "text-blue-400" },
        { label: "Premium", value: `${stats.premiumUsers} (${stats.premiumUserPercentage}%)`, icon: Crown, accent: "text-fuchsia-400" },
        { label: "New (7d)", value: stats.newUsers7Days.toLocaleString(), icon: Users, accent: "text-green-400" },
        { label: "Email Alerts On", value: stats.emailAlertsEnabled.toLocaleString(), icon: Mail, accent: "text-amber-400" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="w-5 h-5" /> User Management
        </h2>
        <Button onClick={load} disabled={loading} variant="outline" size="sm" className="btn-enhanced">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300">{error}</div>
      )}
      {writeDisabled && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-300">
          <AlertTriangle className="w-4 h-4" />
          Writes are disabled in this environment (set <code className="mx-1">ALLOW_ADMIN_WRITES_IN_PROD</code> to enable).
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="card-enhanced">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className={`w-4 h-4 ${s.accent}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <div className={`text-2xl font-bold ${s.accent}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={submitSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search email or name…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="outline">Search</Button>
        {search && (
          <Button type="button" variant="ghost" onClick={() => { setSearchInput(""); setSearch(""); setPage(1); }}>
            Clear
          </Button>
        )}
      </form>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-800 text-left text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">User</th>
                <th className="p-3 font-medium">Role</th>
                <th className="p-3 font-medium">Tier</th>
                <th className="p-3 font-medium text-center">Email Alerts</th>
                <th className="p-3 font-medium text-right">Portfolio</th>
                <th className="p-3 font-medium text-right">Watchlist</th>
                <th className="p-3 font-medium text-right">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                  <td className="p-3">
                    <div className="font-medium">{u.email}</div>
                    {u.displayName && <div className="text-xs text-muted-foreground">{u.displayName}</div>}
                  </td>
                  <td className="p-3">
                    {u.role === "admin" ? (
                      <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30">admin</Badge>
                    ) : (
                      <span className="text-muted-foreground">user</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <TierBadge tier={(u.tier ?? "free") as Tier} />
                      <Select value={u.tier ?? "free"} onValueChange={(v) => setTier(u, v as Tier)} disabled={busyId === u.id}>
                        <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="lite">Lite</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <Switch checked={u.emailAlerts} onCheckedChange={() => toggleEmailAlerts(u)} disabled={busyId === u.id} />
                  </td>
                  <td className="p-3 text-right tabular-nums">{u.portfolioCount}</td>
                  <td className="p-3 text-right tabular-nums">{u.watchlistCount}</td>
                  <td className="p-3 text-right text-muted-foreground whitespace-nowrap">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {!loading && users.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total.toLocaleString()} users • page {page} / {totalPages}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft className="w-4 h-4" /> Prev
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
