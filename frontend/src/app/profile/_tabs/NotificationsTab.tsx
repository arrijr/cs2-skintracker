'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Bell, Mail, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { apiUrl, fetchJson } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

type State = {
  emailAlerts: boolean;
  pushAlerts: boolean;
  discordWebhook: string;
};

export function NotificationsTab() {
  const { getToken } = useAuth();
  const [data, setData] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken({ template: 'backend' });
        if (!token) return;
        const u = await fetchJson(apiUrl('/api/v1/users/me'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData({
          emailAlerts: !!u.emailAlerts,
          pushAlerts: !!u.pushAlerts,
          discordWebhook: u.discordWebhook ?? '',
        });
      } catch (err: unknown) {
        const m = err instanceof Error ? err.message : '';
        if (!m.includes('401')) {
          console.error('Failed to load notification settings:', err);
          setMsg({ type: 'error', text: "Couldn't load notifications. Refresh the page." });
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
      await fetchJson(apiUrl('/api/v1/users/me'), {
        method: 'PATCH',
        body: JSON.stringify({
          emailAlerts: data.emailAlerts,
          pushAlerts: data.pushAlerts,
          discordWebhook: data.discordWebhook,
        }),
      });
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
        Loading notifications…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-red-400 p-4" role="alert">
        Couldn&apos;t load notifications. Refresh the page.
      </div>
    );
  }

  return (
    <Card className="bg-slate-900/60 border-slate-700/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Bell className="w-5 h-5" aria-hidden="true" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="emailAlerts"
              checked={data.emailAlerts}
              onCheckedChange={(c) => setData({ ...data, emailAlerts: c === true })}
            />
            <Label htmlFor="emailAlerts" className="flex items-center gap-2 cursor-pointer">
              <Mail className="w-4 h-4" aria-hidden="true" />
              Email me when prices change
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="pushAlerts"
              checked={data.pushAlerts}
              onCheckedChange={(c) => setData({ ...data, pushAlerts: c === true })}
            />
            <Label htmlFor="pushAlerts" className="flex items-center gap-2 cursor-pointer">
              <Bell className="w-4 h-4" aria-hidden="true" />
              Send push notifications
            </Label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="discordWebhook">Discord webhook URL</Label>
          <Input
            id="discordWebhook"
            value={data.discordWebhook}
            onChange={(e) => setData({ ...data, discordWebhook: e.target.value })}
            placeholder="https://discord.com/api/webhooks/…"
            autoComplete="off"
          />
          <p className="text-xs text-slate-400">
            Alerts post to this webhook. Leave blank to disable.
          </p>
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
