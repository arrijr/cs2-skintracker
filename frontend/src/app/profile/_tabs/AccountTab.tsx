'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { Settings, Save, RefreshCw, AlertTriangle, Calendar, Globe } from 'lucide-react';
import { apiUrl, fetchJson } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencySelect } from '../_components/CurrencySelect';
import { ThemeSelect } from '../_components/ThemeSelect';
import { useCurrency } from '@/contexts/CurrencyContext';

type ProfileData = {
  id: number;
  email: string;
  displayName?: string;
  timezone?: string;
  preferredCurrency: 'USD' | 'EUR' | 'GBP';
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
        const profile = await fetchJson(apiUrl('/api/v1/users/me'), {
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        });
        setData({
          id: profile.id,
          email: profile.email,
          displayName: profile.displayName || '',
          timezone: profile.timezone || '',
          preferredCurrency: (profile.preferredCurrency as 'USD' | 'EUR' | 'GBP') ?? 'USD',
          themePreference: (profile.themePreference as 'DARK' | 'LIGHT' | 'SYSTEM') ?? 'DARK',
          createdAt: profile.createdAt,
        });
      } catch (err) {
        console.error('Failed to load profile:', err);
        setMsg({ type: 'error', text: 'Failed to load profile' });
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
      setMsg({ type: 'success', text: 'Saved' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err: unknown) {
      const text = err instanceof Error ? err.message : 'Failed to save';
      setMsg({ type: 'error', text });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-zinc-400 p-4">Loading…</div>;
  if (!data) return <div className="text-red-400 p-4">Could not load profile.</div>;

  return (
    <Card className="card-enhanced">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={user?.primaryEmailAddress?.emailAddress ?? data.email ?? ''}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
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
            <Label className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Timezone
            </Label>
            <Select
              value={data.timezone || ''}
              onValueChange={(v) => setData({ ...data, timezone: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {Intl.supportedValuesOf('timeZone').map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Member since
            </Label>
            <Input
              value={data.createdAt ? new Date(data.createdAt).toLocaleDateString() : ''}
              disabled
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Preferred currency</Label>
            <CurrencySelect
              value={data.preferredCurrency}
              onChange={(v) => setData({ ...data, preferredCurrency: v })}
            />
            <p className="text-xs text-zinc-500">
              Portfolio values across the app will display in this currency.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Theme</Label>
            <ThemeSelect
              value={data.themePreference}
              onChange={(v) => setData({ ...data, themePreference: v })}
            />
            <p className="text-xs text-zinc-500">
              Light mode visuals coming soon — preference is stored.
            </p>
          </div>
        </div>

        {msg && (
          <div
            className={
              'p-3 rounded-md flex items-center gap-2 ' +
              (msg.type === 'success'
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20')
            }
          >
            {msg.type === 'success' ? <Save className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            {msg.text}
          </div>
        )}

        <div>
          <Button onClick={save} disabled={saving} className="btn-enhanced">
            {saving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save changes
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
