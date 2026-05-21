'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { Save, RefreshCw, AlertTriangle, Globe } from 'lucide-react';
import { apiUrl, fetchJson } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CurrencySelect } from '../_components/CurrencySelect';
// TODO: re-enable theme toggle in Phase 3 once light theme exists across globals.css.
// import { ThemeSelect } from '../_components/ThemeSelect';
import { useCurrency } from '@/contexts/CurrencyContext';
import { SteamConnectSection } from '@/app/account/_components/SteamConnectSection';

type ProfileData = {
  id: number;
  email: string;
  displayName?: string;
  timezone?: string;
  preferredCurrency: 'EUR' | 'USD' | 'GBP';
  themePreference: 'DARK' | 'LIGHT' | 'SYSTEM';
  createdAt: string;
};

export function AccountTab() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { refresh: refreshCurrency } = useCurrency();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken({ template: 'backend' });
        if (!token) return;
        const profile = await fetchJson(apiUrl('/api/v1/users/me'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData({
          id: profile.id,
          email: profile.email,
          displayName: profile.displayName || '',
          timezone: profile.timezone || '',
          preferredCurrency: (profile.preferredCurrency as 'EUR' | 'USD' | 'GBP') ?? 'EUR',
          themePreference: (profile.themePreference as 'DARK' | 'LIGHT' | 'SYSTEM') ?? 'DARK',
          createdAt: profile.createdAt,
        });
      } catch (err: unknown) {
        const m = err instanceof Error ? err.message : '';
        if (!m.includes('401')) {
          console.error('Failed to load profile:', err);
          setMsg({ type: 'error', text: "Couldn't load your profile. Refresh the page." });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setMsg(null);
    try {
      const token = await getToken({ template: 'backend' });
      const updated = await fetchJson(apiUrl('/api/v1/users/me'), {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: data.displayName,
          timezone: data.timezone || undefined,
          preferredCurrency: data.preferredCurrency,
          themePreference: data.themePreference,
        }),
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });
      setData((prev) => (prev ? { ...prev, ...updated } : prev));
      await refreshCurrency();
      setMsg({ type: 'success', text: 'Saved.' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : '';
      setMsg({
        type: 'error',
        text: text || "Couldn't save. Check your connection and try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <div className="h-6 w-32 rounded bg-slate-800/60 animate-pulse mb-4" />
        <div className="h-48 rounded bg-slate-800/40 animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-red-400" role="alert">
        Couldn&apos;t load profile. Refresh the page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <h3 className="text-lg font-semibold text-white">Account details</h3>
      <p className="mt-1 text-sm text-slate-400">
        Your identity, locale and visual preferences across the app.
      </p>

      <div className="mt-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-200">Email</Label>
            <Input
              id="email"
              value={user?.primaryEmailAddress?.emailAddress ?? data.email ?? ''}
              disabled
              className="bg-slate-950 border-slate-800 text-slate-300"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-sm font-medium text-slate-200">Display name</Label>
            <Input
              id="displayName"
              value={data.displayName ?? ''}
              onChange={(e) => setData({ ...data, displayName: e.target.value })}
              placeholder="Your name"
              className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-400 focus:border-fuchsia-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="timezone" className="text-sm font-medium text-slate-200 flex items-center gap-2">
              <Globe className="w-4 h-4" aria-hidden="true" />
              Timezone
            </Label>
            <Select
              value={data.timezone || ''}
              onValueChange={(v) => setData({ ...data, timezone: v })}
            >
              <SelectTrigger id="timezone" className="truncate bg-slate-950 border-slate-800 text-white">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-72 bg-slate-900 border-slate-800 text-slate-100">
                {Intl.supportedValuesOf('timeZone').map((tz) => (
                  <SelectItem key={tz} value={tz} className="text-sm">
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredCurrency" className="text-sm font-medium text-slate-200">Preferred currency</Label>
            <CurrencySelect
              id="preferredCurrency"
              value={data.preferredCurrency}
              onChange={(v) => setData({ ...data, preferredCurrency: v })}
            />
            <p className="text-xs text-slate-400">
              Portfolio values render in this currency app-wide.
            </p>
          </div>
        </div>

        {/* Theme toggle removed until light mode ships (Phase 3) — only dark works today. */}

        <div aria-live="polite" className="min-h-[0]">
          {msg && (
            <div
              role={msg.type === 'error' ? 'alert' : 'status'}
              className={
                'p-3 rounded-md flex items-center gap-2 text-sm ' +
                (msg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'bg-red-500/10 text-red-400 border border-red-500/30')
              }
            >
              {msg.type === 'success' ? (
                <Save className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
              {msg.text}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <Button
            onClick={save}
            disabled={saving}
            className="bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-600 hover:to-pink-600 text-white"
          >
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                Save changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>

    {/* Steam connection — identity / profile, not security */}
    <section id="steam">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        Connections
      </p>
      <SteamConnectSection />
    </section>
    </div>
  );
}
