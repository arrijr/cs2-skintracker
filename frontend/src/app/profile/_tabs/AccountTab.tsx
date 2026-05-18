'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { Settings, Save, RefreshCw, AlertTriangle, Globe } from 'lucide-react';
import { apiUrl, fetchJson } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ThemeSelect } from '../_components/ThemeSelect';
import { useCurrency } from '@/contexts/CurrencyContext';

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
        const msg = err instanceof Error ? err.message : '';
        if (!msg.includes('401')) {
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
      const updated = await fetchJson(apiUrl('/api/v1/users/me'), {
        method: 'PATCH',
        body: JSON.stringify({
          displayName: data.displayName,
          timezone: data.timezone || undefined,
          preferredCurrency: data.preferredCurrency,
          themePreference: data.themePreference,
        }),
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
      <div className="text-slate-400 p-4" role="status" aria-busy="true">
        Loading account…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-red-400 p-4" role="alert">
        Couldn&apos;t load profile. Refresh the page.
      </div>
    );
  }

  return (
    <Card className="bg-slate-900/60 border-slate-700/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Settings className="w-5 h-5" aria-hidden="true" />
          Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.primaryEmailAddress?.emailAddress ?? data.email ?? ''}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={data.displayName ?? ''}
              onChange={(e) => setData({ ...data, displayName: e.target.value })}
              placeholder="Your name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="timezone" className="flex items-center gap-2">
              <Globe className="w-4 h-4" aria-hidden="true" />
              Timezone
            </Label>
            <Select
              value={data.timezone || ''}
              onValueChange={(v) => setData({ ...data, timezone: v })}
            >
              <SelectTrigger id="timezone" className="truncate">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {Intl.supportedValuesOf('timeZone').map((tz) => (
                  <SelectItem key={tz} value={tz} className="text-sm">
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preferredCurrency">Preferred currency</Label>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="themePreference">Theme</Label>
            <ThemeSelect
              id="themePreference"
              value={data.themePreference}
              onChange={(v) => setData({ ...data, themePreference: v })}
            />
            <p className="text-xs text-slate-400">Saved now. Light mode lands soon.</p>
          </div>
        </div>

        <div aria-live="polite" className="min-h-[0]">
          {msg && (
            <div
              role={msg.type === 'error' ? 'alert' : 'status'}
              className={
                'p-3 rounded-md flex items-center gap-2 text-sm ' +
                (msg.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-red-500/10 text-red-400 border border-red-500/20')
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

        <div className="flex justify-end pt-2 border-t border-slate-700/40">
          <Button onClick={save} disabled={saving}>
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                Save
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
