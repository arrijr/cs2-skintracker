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
        const u = await fetchJson(apiUrl('/api/v1/users/me'), {
          headers: { ...(token && { Authorization: `Bearer ${token}` }) },
        });
        setData({
          emailAlerts: !!u.emailAlerts,
          pushAlerts: !!u.pushAlerts,
          discordWebhook: u.discordWebhook ?? '',
        });
      } catch (err) {
        console.error('Failed to load notification settings:', err);
        setMsg({ type: 'error', text: 'Failed to load settings' });
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
  if (!data) return <div className="text-red-400 p-4">Could not load settings.</div>;

  return (
    <Card className="card-enhanced">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
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
            <Label htmlFor="emailAlerts" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Receive email alerts for price changes
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="pushAlerts"
              checked={data.pushAlerts}
              onCheckedChange={(c) => setData({ ...data, pushAlerts: c === true })}
            />
            <Label htmlFor="pushAlerts" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Receive push notifications
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
          />
          <p className="text-xs text-zinc-500">
            Optional. Alerts will be delivered to this webhook. Leave blank to disable.
          </p>
        </div>

        {msg && (
          <div
            className={
              'p-3 rounded-md flex items-center gap-2 text-sm ' +
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
